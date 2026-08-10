export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  version: number;
}

export interface EmbeddingProvider {
  readonly providerName: string;
  generateEmbedding(sanitizedText: string): Promise<EmbeddingResult>;
}
