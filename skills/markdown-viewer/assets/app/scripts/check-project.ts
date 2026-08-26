import { resolve } from "node:path";

import { list_documents } from "../src/lib/document-manifest";
import { load_viewer_config } from "../src/lib/viewer-config";

const requested_root = process.argv[2];
if (!requested_root) {
  throw new Error("Informe o projeto a validar.");
}

process.env.MARKDOWN_VIEWER_PROJECT_ROOT = resolve(requested_root);
const config = await load_viewer_config();
const documents = await list_documents(config);

process.stdout.write(
  `${JSON.stringify({ project_title: config.project_title, documents: documents.length })}\n`,
);
