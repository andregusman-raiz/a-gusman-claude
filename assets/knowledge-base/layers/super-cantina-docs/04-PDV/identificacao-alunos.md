# Identificação de Alunos - PDV

## Visão Geral

O PDV suporta **3 métodos** de identificação de alunos, otimizados para velocidade e confiabilidade em ambiente de cantina escolar.

> **Requisito**: Identificação em **menos de 2 segundos**.

---

## Métodos de Identificação

| Método | Prioridade | Tempo Médio | Hardware |
|--------|------------|-------------|----------|
| QR Code | Principal | 0.5s | Câmera/Scanner |
| NFC | Alternativo | 0.8s | Leitor NFC |
| Nome | Fallback | 3-5s | Teclado |

---

## Fluxo de Identificação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE IDENTIFICAÇÃO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌────────────────────┐                                │
│                        │  AGUARDANDO ALUNO  │                                │
│                        └─────────┬──────────┘                                │
│                                  │                                           │
│         ┌────────────────────────┼────────────────────────┐                  │
│         │                        │                        │                  │
│         ▼                        ▼                        ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐             │
│  │  QR Code    │         │    NFC      │         │   Nome      │             │
│  │  Detectado  │         │  Detectado  │         │  Digitado   │             │
│  └──────┬──────┘         └──────┬──────┘         └──────┬──────┘             │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐             │
│  │   Decode    │         │  Lookup     │         │   Search    │             │
│  │  QR → UUID  │         │ Tag → UUID  │         │  name → []  │             │
│  └──────┬──────┘         └──────┬──────┘         └──────┬──────┘             │
│         │                       │                       │                    │
│         │                       │                       ▼                    │
│         │                       │               ┌─────────────┐              │
│         │                       │               │  Múltiplos  │              │
│         │                       │               │ resultados? │              │
│         │                       │               └──────┬──────┘              │
│         │                       │                      │                     │
│         │                       │          ┌───────────┴───────────┐         │
│         │                       │          │                       │         │
│         │                       │          ▼                       ▼         │
│         │                       │   ┌─────────────┐       ┌─────────────┐    │
│         │                       │   │  Operador   │       │   Único     │    │
│         │                       │   │  seleciona  │       │ encontrado  │    │
│         │                       │   └──────┬──────┘       └──────┬──────┘    │
│         │                       │          │                     │           │
│         └───────────────────────┴──────────┴─────────────────────┘           │
│                                  │                                           │
│                                  ▼                                           │
│                        ┌────────────────────┐                                │
│                        │  ALUNO IDENTIFICADO│                                │
│                        │                    │                                │
│                        │  • Nome            │                                │
│                        │  • Foto            │                                │
│                        │  • Status          │                                │
│                        │  • Saldo restante  │                                │
│                        └────────────────────┘                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Formato do QR Code

### Estrutura

```
STUDENT:<uuid>:<checksum>

Exemplo:
STUDENT:550e8400-e29b-41d4-a716-446655440000:a1b2c3
```

### Validação

```typescript
// src/services/qr-validator.ts

import { createHash } from 'crypto';

interface QRValidation {
  valid: boolean;
  studentId?: string;
  error?: string;
}

export function validateQRCode(qrData: string): QRValidation {
  // Verificar formato
  const parts = qrData.split(':');

  if (parts.length !== 3) {
    return { valid: false, error: 'Formato inválido' };
  }

  const [prefix, studentId, checksum] = parts;

  // Verificar prefixo
  if (prefix !== 'STUDENT') {
    return { valid: false, error: 'Prefixo inválido' };
  }

  // Verificar UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId)) {
    return { valid: false, error: 'UUID inválido' };
  }

  // Verificar checksum
  const expectedChecksum = generateChecksum(studentId);
  if (checksum !== expectedChecksum) {
    return { valid: false, error: 'Checksum inválido' };
  }

  return { valid: true, studentId };
}

function generateChecksum(studentId: string): string {
  const secret = process.env.QR_CHECKSUM_SECRET || 'default-secret';
  return createHash('sha256')
    .update(studentId + secret)
    .digest('hex')
    .slice(0, 6);
}

// Gerar QR Code para aluno
export function generateQRCode(studentId: string): string {
  const checksum = generateChecksum(studentId);
  return `STUDENT:${studentId}:${checksum}`;
}
```

---

## Scanner QR Code

### Componente

```tsx
// src/components/identification/QRScanner.tsx

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';
import { validateQRCode } from '../../services/qr-validator';

interface Props {
  onScan: (studentId: string) => void;
  onError: (error: string) => void;
  enabled: boolean;
}

export function QRScanner({ onScan, onError, enabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!enabled) {
      stopScanning();
      return;
    }

    startScanning();

    return () => stopScanning();
  }, [enabled]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, ['QR_CODE']);
      hints.set(DecodeHintType.TRY_HARDER, true);

      readerRef.current = new BrowserMultiFormatReader(hints);

      // Preferir câmera traseira em tablets
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('traseira')
      );

      const deviceId = backCamera?.deviceId || devices[0]?.deviceId;

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScan(result.getText());
          }
          // Ignorar erros de "not found" - são normais durante scan
        }
      );

      setIsScanning(true);
    } catch (err) {
      onError('Erro ao acessar câmera');
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = (data: string) => {
    // Debounce para evitar scans repetidos
    stopScanning();

    const validation = validateQRCode(data);

    if (validation.valid && validation.studentId) {
      onScan(validation.studentId);
    } else {
      onError(validation.error || 'QR Code inválido');
      // Reiniciar scan após erro
      setTimeout(() => startScanning(), 1500);
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto">
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        playsInline
        muted
      />

      {/* Overlay com guia */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50" />
      </div>

      {/* Indicador de status */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className={`px-3 py-1 rounded-full text-sm ${
          isScanning ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
        }`}>
          {isScanning ? 'Escaneando...' : 'Iniciando câmera...'}
        </span>
      </div>
    </div>
  );
}
```

---

## Leitor NFC

### Integração com Hardware

```typescript
// src/services/nfc-reader.ts

interface NFCReaderConfig {
  vendorId: number;
  productId: number;
}

type NFCCallback = (tagId: string) => void;
type ErrorCallback = (error: Error) => void;

export class NFCReader {
  private device: HIDDevice | null = null;
  private onTagRead: NFCCallback | null = null;
  private onError: ErrorCallback | null = null;

  async connect(config: NFCReaderConfig): Promise<boolean> {
    try {
      // WebHID API para acesso ao leitor
      const devices = await navigator.hid.requestDevice({
        filters: [{
          vendorId: config.vendorId,
          productId: config.productId,
        }],
      });

      if (devices.length === 0) {
        throw new Error('Nenhum leitor NFC encontrado');
      }

      this.device = devices[0];
      await this.device.open();

      // Configurar listener de dados
      this.device.addEventListener('inputreport', this.handleInputReport.bind(this));

      return true;
    } catch (error) {
      this.onError?.(error as Error);
      return false;
    }
  }

  private handleInputReport(event: HIDInputReportEvent) {
    // Decodificar dados do leitor (formato varia por fabricante)
    const data = new Uint8Array(event.data.buffer);
    const tagId = this.decodeTagId(data);

    if (tagId) {
      this.onTagRead?.(tagId);
    }
  }

  private decodeTagId(data: Uint8Array): string | null {
    // Exemplo para leitor ACR122U
    // Os bytes 2-5 contêm o ID do tag
    if (data.length < 6) return null;

    const id = Array.from(data.slice(2, 6))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();

    return `NFC:${id}`;
  }

  setOnTagRead(callback: NFCCallback): void {
    this.onTagRead = callback;
  }

  setOnError(callback: ErrorCallback): void {
    this.onError = callback;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close();
      this.device = null;
    }
  }
}

// Hook para React
export function useNFCReader(onTagRead: NFCCallback) {
  const readerRef = useRef<NFCReader | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new NFCReader();
    readerRef.current = reader;

    reader.setOnTagRead(onTagRead);
    reader.setOnError((err) => setError(err.message));

    // Conectar automaticamente
    reader.connect({
      vendorId: 0x072F, // ACR122U
      productId: 0x2200,
    }).then(setIsConnected);

    return () => {
      reader.disconnect();
    };
  }, [onTagRead]);

  return { isConnected, error };
}
```

---

## Busca por Nome

### Componente

```tsx
// src/components/identification/NameSearch.tsx

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, User } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  photoUrl?: string;
  grade: string;
}

interface Props {
  onSelect: (studentId: string) => void;
  searchStudents: (query: string) => Promise<Student[]>;
}

export function NameSearch({ onSelect, searchStudents }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Buscar quando query muda
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    searchStudents(debouncedQuery)
      .then(setResults)
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, searchStudents]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          onSelect(results[selectedIndex].id);
        }
        break;
      case 'Escape':
        setQuery('');
        setResults([]);
        break;
    }
  }, [results, selectedIndex, onSelect]);

  return (
    <div className="w-full max-w-md">
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome do aluno..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <ul className="mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((student, index) => (
            <li
              key={student.id}
              onClick={() => onSelect(student.id)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">{student.grade}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Mensagem de nenhum resultado */}
      {query.length >= 2 && !isLoading && results.length === 0 && (
        <p className="mt-2 text-center text-gray-500">
          Nenhum aluno encontrado
        </p>
      )}
    </div>
  );
}
```

---

## Serviço de Identificação

```typescript
// src/services/identification.service.ts

import { DatabaseService } from '../database/sqlite';
import { validateQRCode } from './qr-validator';

interface IdentificationResult {
  success: boolean;
  student?: StudentInfo;
  method: 'QR_CODE' | 'NFC' | 'NAME_SEARCH';
  error?: string;
}

interface StudentInfo {
  id: string;
  name: string;
  photoUrl?: string;
  grade: string;
  status: 'OK' | 'LIMIT_REACHED' | 'BLOCKED';
  remainingToday: number;
}

export class IdentificationService {
  constructor(private database: DatabaseService) {}

  /**
   * Identificar por QR Code
   */
  async identifyByQR(qrData: string): Promise<IdentificationResult> {
    const validation = validateQRCode(qrData);

    if (!validation.valid) {
      return {
        success: false,
        method: 'QR_CODE',
        error: validation.error,
      };
    }

    const student = await this.database.findStudentByQR(qrData);

    if (!student) {
      return {
        success: false,
        method: 'QR_CODE',
        error: 'Aluno não encontrado',
      };
    }

    return {
      success: true,
      method: 'QR_CODE',
      student: await this.enrichStudentInfo(student),
    };
  }

  /**
   * Identificar por NFC Tag
   */
  async identifyByNFC(tagId: string): Promise<IdentificationResult> {
    const student = await this.database.findStudentByNFC(tagId);

    if (!student) {
      return {
        success: false,
        method: 'NFC',
        error: 'Tag não cadastrada',
      };
    }

    return {
      success: true,
      method: 'NFC',
      student: await this.enrichStudentInfo(student),
    };
  }

  /**
   * Buscar por nome
   */
  async searchByName(query: string, limit: number = 10): Promise<StudentInfo[]> {
    const students = await this.database.searchStudentsByName(query, limit);
    return Promise.all(students.map(s => this.enrichStudentInfo(s)));
  }

  /**
   * Selecionar aluno da lista
   */
  async selectStudent(studentId: string): Promise<IdentificationResult> {
    const student = await this.database.findStudentById(studentId);

    if (!student) {
      return {
        success: false,
        method: 'NAME_SEARCH',
        error: 'Aluno não encontrado',
      };
    }

    return {
      success: true,
      method: 'NAME_SEARCH',
      student: await this.enrichStudentInfo(student),
    };
  }

  /**
   * Adicionar informações de status e saldo
   */
  private async enrichStudentInfo(student: Student): Promise<StudentInfo> {
    const today = new Date().toISOString().split('T')[0];
    const aggregate = await this.database.getOrCreateAggregate(student.id, today);

    const dailyLimit = student.rules?.dailyLimit || 0;
    const remaining = Math.max(0, dailyLimit - aggregate.totalSpent);

    let status: 'OK' | 'LIMIT_REACHED' | 'BLOCKED' = 'OK';

    if (remaining === 0) {
      status = 'LIMIT_REACHED';
    }

    // Verificar se está bloqueado por outro motivo
    if (student.isBlocked) {
      status = 'BLOCKED';
    }

    return {
      id: student.id,
      name: student.name,
      photoUrl: await this.getPhotoUrl(student.photoHash),
      grade: student.grade,
      status,
      remainingToday: remaining,
    };
  }

  /**
   * Obter URL da foto do cache
   */
  private async getPhotoUrl(photoHash?: string): Promise<string | undefined> {
    if (!photoHash) return undefined;

    // Tentar cache local primeiro
    const cached = await this.imageCache.getPhoto(photoHash);
    if (cached) {
      return URL.createObjectURL(cached);
    }

    // Retornar placeholder se não tiver cache
    return undefined;
  }
}
```

---

## Testes

```typescript
// src/services/__tests__/identification.test.ts

describe('IdentificationService', () => {
  describe('identifyByQR', () => {
    it('deve identificar aluno com QR válido', async () => {
      mockDatabase.findStudentByQR.mockResolvedValue({
        id: 'student-1',
        name: 'João Silva',
        qrCode: 'STUDENT:student-1:abc123',
      });

      const result = await service.identifyByQR('STUDENT:student-1:abc123');

      expect(result.success).toBe(true);
      expect(result.student?.name).toBe('João Silva');
      expect(result.method).toBe('QR_CODE');
    });

    it('deve rejeitar QR com checksum inválido', async () => {
      const result = await service.identifyByQR('STUDENT:student-1:wrong');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Checksum');
    });
  });

  describe('searchByName', () => {
    it('deve retornar resultados ordenados por relevância', async () => {
      mockDatabase.searchStudentsByName.mockResolvedValue([
        { id: '1', name: 'Maria Silva' },
        { id: '2', name: 'Mariana Santos' },
      ]);

      const results = await service.searchByName('mari');

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Maria Silva');
    });
  });
});
```

---

## Referências

- [Arquitetura Offline](./arquitetura-offline.md)
- [Decision Local](./decision-local.md)
- [PDV API](../02-BACKEND-API/pdv-api.md)
