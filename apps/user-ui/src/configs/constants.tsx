export interface NavItemsTypes {
  title: string;
  href: string;
}

export const navItems: NavItemsTypes[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Products",
    href: "/products"
  },
  {
    title: "shops",
    href: "/shops"
  },
  {
    title: "Offers",
    href: "/offers"
  },
  {
    title: "Become a Seller",
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
  },
]