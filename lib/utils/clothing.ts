const CLOTHING_CATEGORY_PATTERN = /fashion|clothing|apparel|menswear|womenswear|men[' -]?s|women[' -]?s|footwear|shoes|accessor|bags|traditional|ankara/i;

export function isClothingCategory(name: string | null | undefined, slug: string | null | undefined): boolean {
  return CLOTHING_CATEGORY_PATTERN.test(`${name ?? ''} ${slug ?? ''}`);
}
