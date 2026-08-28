"""registry_lib.py — leitura/escrita segura do registry.json dos terminais.

Motivo (auditoria 2026-08-27): terminal-open.sh, terminal-close.sh,
terminal-resolve.sh e terminais-watchdog.sh faziam read-modify-write com
`open(path, "w")` + `json.dump` direto no arquivo final, sem lock. Dois modos
de falha reais, porque o watchdog roda por launchd a cada 5 min enquanto um
humano/agente pode rodar open/close/send (que chama resolve) a qualquer hora:

  1. lost update  — dois writers leem v10, ambos gravam v11; a mudanca do
     primeiro desaparece em silencio.
  2. leitura truncada — `open("w")` trunca ANTES do dump; um leitor que caia
     nessa janela ve JSON invalido. Consequencia observavel: terminal-send
     recusa entregar ordem, watchdog registra registry_error.

Cura: flock exclusivo num lockfile separado + escrita em arquivo temporario +
fsync + os.replace (rename atomico) + fsync do diretorio.

Uso a partir de heredoc bash:

    import os, sys
    sys.path.insert(0, os.environ.get(
        "REGISTRY_LIB_DIR", os.path.expanduser("~/.claude/scripts")))
    from registry_lib import mutate, load

    def change(reg):
        reg["terminais"][papel]["estado"] = "fechado"
    mutate(registry_path, change)
"""

import fcntl
import json
import os
import tempfile
import time
from contextlib import contextmanager

LOCK_SUFFIX = ".lock"
DEFAULT_TIMEOUT = 10.0


class RegistryLockTimeout(RuntimeError):
    """Nao conseguiu o lock dentro do timeout — melhor falhar do que corromper."""


@contextmanager
def _locked(path, mode, timeout):
    # Lockfile separado de proposito: travar o proprio registry.json exigiria
    # abri-lo para escrita, que e justamente o que trunca o arquivo.
    lock_path = path + LOCK_SUFFIX
    fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o644)
    deadline = time.monotonic() + timeout
    try:
        while True:
            try:
                fcntl.flock(fd, mode | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    raise RegistryLockTimeout(
                        f"lock de {path} nao liberado em {timeout}s "
                        f"(outro processo escrevendo?)"
                    )
                time.sleep(0.1)
        yield
    finally:
        try:
            fcntl.flock(fd, fcntl.LOCK_UN)
        finally:
            os.close(fd)


def _atomic_write(path, data):
    directory = os.path.dirname(path) or "."
    fd, tmp = tempfile.mkstemp(dir=directory, prefix=".registry-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
        dir_fd = os.open(directory, os.O_RDONLY)
        try:
            os.fsync(dir_fd)
        finally:
            os.close(dir_fd)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def load(path, timeout=DEFAULT_TIMEOUT):
    """Le o registry sob lock compartilhado."""
    with _locked(path, fcntl.LOCK_SH, timeout):
        with open(path) as f:
            return json.load(f)


def mutate(path, fn, timeout=DEFAULT_TIMEOUT):
    """Read-modify-write serializado.

    `fn(reg)` altera o dict in-place ou devolve um dict novo. A leitura
    acontece DENTRO do lock — nunca reaproveite um registry lido antes.
    Devolve o registry gravado.

    No-op guard (achado 1d, revisor adversarial 2026-08-28): se `fn` roda mas
    nao muda o conteudo semantico do JSON (comparado pelo dump canonico), o
    arquivo NAO e regravado — sem isso, um chamador periodico (ex.: render a
    cada 10 min via launchd) cujo `fn` nao tem nada a fazer neste ciclo ainda
    assim trocava mtime/inode e fazia I/O identico pra sempre. O valor
    retornado continua sendo o registry atualizado (identico ao lido, nesse
    caso) — chamadores que so usam o retorno nao percebem diferenca.
    """
    with _locked(path, fcntl.LOCK_EX, timeout):
        with open(path) as f:
            original_text = f.read()
        reg = json.loads(original_text)
        result = fn(reg)
        if result is not None:
            reg = result
        new_text = json.dumps(reg, ensure_ascii=False, indent=2) + "\n"
        if new_text != original_text:
            _atomic_write(path, reg)
        return reg
