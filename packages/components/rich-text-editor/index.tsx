"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Load ReactQuill only on client (avoids SSR crash)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type Props = {
  value: string;
  onChange: (content: string) => void;
};

const RichTextEditor: React.FC<Props> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState<string>(value || "");
  const quillInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (typeof document === "undefined") return; // SSR protection

    if (!quillInitialized.current) {
      quillInitialized.current = true;

      // Remove extra toolbars
      setTimeout(() => {
        document
          .querySelectorAll(".ql-toolbar")
          .forEach((toolbar: Element, index: number) => {
            if (index > 0) toolbar.remove();
          });
      }, 100);
    }
  }, []);

  return (
    <div className="relative">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={(content: string) => {
          setEditorValue(content);
          onChange(content);
        }}
        modules={{
          toolbar: [
            [{ font: [] }],
            [{ size: ["small", false, "large", "huge"] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }],
            [{ align: [] }],
            ["blockquote", "code-block"],
            ["link", "image", "video", "formula"],
            ["clean"],
          ],
        }}
        placeholder="Write a detailed description..."
        className="bg-transparent border-gray-300 rounded-md"
        style={{ minHeight: "200px" }}
      />

      {/* Custom styling */}
      <style>
        {`
          .ql-toolbar {
            background: transparent;
            border-color: #444;
          }
          .ql-container {
            background: transparent !important;
            border-color: #444 !important;
            color: white !important;
          }
          .ql-container .ql-editor {
            min-height: 200px;
          }
          .ql-editor.ql-blank::before {
            color: #aaa !important;
          }
          .ql-picker, .ql-picker-options {
            color: white !important;
            background: #333 !important;
          }
          .ql-stroke {
            stroke: white !important;
          }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
























// import React, {useEffect, useRef, useState } from "react";
// import "react-quill-new/dist/quill.snow.css";
// import ReactQuill from "react-quill-new";

// const RichTextEditor = ({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (content: string) => void;
// }) => {
  
//   const [editorValue, setEditorValue] = useState(value || ""); // Single state

 
//   const quillRef = useRef(false);

//   useEffect(() => {
//     if (!quillRef.current) {
//       quillRef.current = true; // Mark as Mounted

//       // Fix: Ensure only one toolbar is present
//       setTimeout (() => {
//         document
//           .querySelectorAll(".ql-toolbar")
//           .forEach((toolbar, index) => {
//             if (index > 0){
//               toolbar.remove(); // Remove extra toolbars
//             }
//           }); // Short delay ensures Quill is fully initialized
//       }, 100);
//     }
//   }, []);

//   return (
//     // FIX: The opening tag was incomplete, likely missing 'div'
//     <div className="relative">
//       <ReactQuill
//         theme="snow"
//         value={editorValue}
//         onChange={(content) => {
//           setEditorValue(content); // Update local state
//           onChange(content); // Notify parent component
//         }}
//         modules={{
//           toolbar: [
//             [{ font: [] }],
//             [{size: ["small", false, "large", "huge"] }], // 'false' is correct for default size
//             [{ header: [1, 2, 3, 4, 5, 6, false] }],
//             ["bold", "italic", "underline", "strike"],
//             [{ color: [] }, { background: [] }],
//             [{ script: "sub" }, { script: "super" }],
//             [{ list: "ordered" }, { list: "bullet" }],
//             [{ indent: "-1" }, { indent: "+1" }],
//             [{ direction: "rtl" }],
//             [{ align: [] }],
//             ["blockquote", "code-block"],
//             ["link", "image", "video", "formula"],
//             ["clean"],
//           ],
//         }}
//         placeholder="Write a detailed description..."
//         className="bg-transparent border-gray-300 rounded-md"
//         style={{ minHeight: "200px" }} // Minimum height for better UX
//       />
//       <style>
//         {`
//           .ql-toolbar {
//             background: transparent; /* Dark toolbar */
//             border-color: #444;
//           }
//           .ql-container {
//             background: transparent ! important;
//             border-color: #444;
//             color: white; /* Text color inside editor */
//           }
//           .ql-container .ql-picker { /* Fix: Standard descendant selector */
//             color: white!important;
//           }
//           .ql-container .ql-editor { /* Fix: Standard descendant selector */
//             min-height: 200px;
//           }
//           .ql-snow.ql-container { /* More specific selector for border */
//             border-color:#444!important
//           }
//           .ql-editor.ql-blank::before{
//             color:#aaa !important;
//           }
//           .ql-picker-options{
//             background:#333 !important;
//             color:white !important;
//           }
//           .ql-stroke{
//             stroke:white!important;
//           }
//         `}
//       </style>
//     </div> 
//   )
// }

// export default RichTextEditor; // Added export for component usage