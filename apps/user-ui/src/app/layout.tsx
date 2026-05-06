import './global.css';
import Header from '../shared/widgets';
import { Poppins, Roboto } from "next/font/google";
import Providers from './providers';
import HeaderBottom from '@/shared/widgets/header-bottom';
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: 'My-Shop',
  description: 'Multi Vendor Online seller Platform Developed by Raj Singh',
}

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-roboto',
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <Providers>
          <Header />
          {children}
          {/* <HeaderBottom /> */}
          <Toaster
            toastOptions={{
              duration: 3000,
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
