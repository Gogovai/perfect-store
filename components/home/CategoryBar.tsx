import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ShoppingBag, Shirt } from "lucide-react";
import { getCategoryColor, getCategoryImage } from "@/lib/data/storefront-content";
import type { Category } from "@/lib/queries/categories";

const ICONS: Record<string, typeof ShoppingBag> = {
  fashion: Shirt,
  clothing: Shirt,
  apparel: Shirt,
  menswear: Shirt,
  "mens-clothing": Shirt,
  "mens-fashion": Shirt,
  womenswear: Shirt,
  "womens-clothing": Shirt,
  "womens-fashion": Shirt,
  shoes: ShoppingBag,
  footwear: ShoppingBag,
  accessories: ShoppingBag,
  bags: ShoppingBag,
  "traditional-wear": Shirt,
  ankara: Shirt,
};

export function CategoryBar({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <div className="border-b border-gray-200 bg-white">
      <Container size="xl">
        <div className="scrollbar-hide flex gap-4 overflow-x-auto py-3 sm:gap-6">
          {categories.map((category) => {
            const imageUrl =
              category.image_url || getCategoryImage(category.slug, null);
            const Icon = ICONS[category.slug] || ShoppingBag;

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex shrink-0 flex-col items-center gap-1.5"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-transparent transition-all group-hover:border-[#e85d26] sm:h-14 sm:w-14">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        backgroundColor: `${getCategoryColor(category.slug)}18`,
                      }}
                    >
                      <Icon
                        size={24}
                        style={{ color: getCategoryColor(category.slug) }}
                      />
                    </div>
                  )}
                </div>
                <span className="whitespace-nowrap text-center text-[11px] font-medium text-gray-700 transition-colors group-hover:text-[#0f2b5b] sm:text-xs">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
