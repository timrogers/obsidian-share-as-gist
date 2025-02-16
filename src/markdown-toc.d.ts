declare module 'markdown-toc' {
  interface TocResult {
    content: string;
    json: Array<{
      content: string;
      slug: string;
      lvl: number;
    }>;
  }

  function toc(input: string, options?: unknown): TocResult;
  export default toc;
}
