declare module 'prettysize' {
  interface PrettySizeOptions {
    nospace?: boolean;
    one?: boolean;
    places?: number;
    hideSizeString?: boolean;
  }

  export default function prettysize(
    size: number | string,
    nospaceOrOptions?: boolean | PrettySizeOptions,
    one?: boolean,
    places?: number,
    hideSizeString?: boolean,
  ): string;
}
