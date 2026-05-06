//import Image from 'next/image'
import  ImageKit from 'imagekit';



export const imageKit = new ImageKit({
  publicKey:process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey:process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint:"https://ik.imagekit.io/myshopimage"
});