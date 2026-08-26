export type PublishedDocument = {
  category: string;
  slug: string[];
  title: string;
};

export type PublishedDocumentContent = PublishedDocument & {
  content: string;
};
