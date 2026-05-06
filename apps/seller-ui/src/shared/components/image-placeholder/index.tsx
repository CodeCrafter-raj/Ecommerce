import React from 'react'
import { Pencil, WandSparkles, X } from 'lucide-react';
import Image from 'next/image';

const ImagePlaceHolder = ({
  size, small, 
  onImageChange,
  pictureUploadingLoader,
  onRemove,
  defaultImage = null,
  index = null,
  setSelectedImage, 
  setOpenImageModal,images,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  pictureUploadingLoader:boolean;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  setSelectedImage:(e:string)=>void;
  images:any;
  setOpenImageModal: (openImageModal: boolean) => void;
  index?: any;
}) => {

  const [imagePreview, setImagePreview] = React.useState<string | null>(defaultImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target.files?.[0] || null;
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      onImageChange(file, index!);
    }
  };
  return (
    <div className={`relative  ${small ? "h-[180px]" : "h-[450px]"} w-full corsor-pointer bg-[#1e1e1e1e] border-gray-600 flex flex-col justify-center items-center}`}>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />

      {imagePreview ? (
    <>
      <button 
        type="button" 
        disabled={pictureUploadingLoader}
        onClick={() => onRemove?.(index!)}
        className="absolute top-3 right-3 p-2 !rounded bg-red-600 shadow-lg"
      > {/* <-- Syntax error fixed here: closing angle bracket added */}
        <X size={16} />
      </button>

      <button 
      disabled={pictureUploadingLoader}
        className="absolute top-3 right-[70px] p-2 !rounded bg-blue-500 shadow-lg cursor-pointer" // <-- Typo 'top-з' fixed to 'top-3'
        onClick={()=>{setOpenImageModal(true);
          setSelectedImage(images[index].file_url);
        }}
      >
        <WandSparkles size={16}/>
      </button>
    </>
):(
      <label className='absolute top-3 right-3 p-2 !rounded bg-slate-700 shadow-lg cursor-pointer' htmlFor={`image-upload-${index}`} 
      >
        <Pencil size={16} />
      </label>
)}
{
    imagePreview ? (
        // Display the selected image
        <Image 
            width={400} 
            height={400} 
            src={imagePreview}
            alt="Selected Image"
            className='w-full h-full object-cover rounded-lg'
        />
    ) : (
        <>
            <p className={`text-gray-500 ${small ? "text-xl" : "text-4xl"} font-semibold `}>
                {/* ^-- Fixed: "text-4lg" is not valid, changed to "text-4xl" 
                */}
                {size}
            </p>
            <p className={`text-gray-500 ${small ? "text-sm" : "text-lg"} pt-2 text-center`}>
                Please Choose an image <br/> {/* Optional: Changed "Chose" to "Choose" */}
                According to the expected ratio {/* Optional: Changed "ration" to "ratio" */}
            </p>
        </>
    )
}

  </div >
  );
};

export default ImagePlaceHolder;
