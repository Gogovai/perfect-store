const CLOTHING_CATEGORY_PATTERN = /\\b(?:fashion|clothing|apparel|menswear|womenswear|men|women|men[' -]?s|women[' -]?s|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t[ -]?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\b/i;

export function isClothingCategory(name: string | null | undefined, slug: string | null | undefined): boolean {
  return CLOTHING_CATEGORY_PATTERN.test(`${name ?? ''} ${slug ?? ''}`);
}
