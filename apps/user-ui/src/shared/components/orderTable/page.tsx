"use client";
import React from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { ArrowUpRight, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosOrder from "@/utils/axiosOrder";

export const OrderTable = () => {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["users-orders"],
    queryFn: async () => {
      const res = await axiosOrder.get("/get-user-orders");
      return res.data.orders;
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting()}
        >
          Order ID
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: (info: any) => info.getValue()?.slice(-6),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting()}
        >
          Status
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
    },
    {
      accessorKey: "placedAt",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting()}
        >
          Date
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: (info: any) =>
        new Date(info.getValue())?.toLocaleDateString(),
    },
    {
      accessorKey: "subTotal",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-semibold"
          onClick={() => column.toggleSorting()}
        >
          Total
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: (info: any) => `$${info.getValue()?.toFixed(2)}`,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/order/${row.original.id}`)}
          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
        >
          Track Order <ArrowUpRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  // Table instance with sorting + pagination
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ---------------------
  //  LOADING SKELETON UI
  // ---------------------
  if (isLoading) {
    return (
      <div className="w-full mt-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 rounded mb-2"
          ></div>
        ))}
      </div>
    );
  }

  // ---------------------
  //   EMPTY STATE UI
  // ---------------------
  if (!isLoading && data?.length === 0) {
    return (
      <div className="flex flex-col gap-2 justify-center items-center h-[40vh] text-gray-600">
        <p className="text-lg font-semibold">No Orders Found</p>
        <p className="text-sm">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <table className="w-full text-sm border-collapse rounded-lg overflow-hidden shadow-md">
        <thead className="bg-gray-100 text-gray-900">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="text-left border-b">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-3 font-semibold">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-gray-50 transition"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </strong>
        </span>

        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OrderTable;





















// "use client";
// import React from "react";
// import {
//   ColumnDef,
//   useReactTable,
//   getCoreRowModel,
//   getRowModel,
//   flexRender,
// } from "@tanstack/react-table";
// import { useQuery } from "@tanstack/react-query";
// import axiosInstance from "@/utils/axiosInstance";
// import { ArrowUpRight } from "lucide-react";
// import { useRouter } from "next/navigation";

// export const OrderTable = () => {
//   const router = useRouter();

//   const { data, isLoading } = useQuery({
//     queryKey: ["users-orders"],
//     queryFn: async () => {
//       const res = await axiosInstance.get("/api/orders/get-user-orders");
//       return res.data.orders;
//     },
//   });

//   const columns: ColumnDef<any>[] = [
//     {
//       accessorKey: "id",
//       header: "Order ID",
//       cell: (info: any) => info.getValue()?.slice(-6),
//     },
//     {
//       accessorKey: "status",
//       header: "Status",
//     },
//     {
//       accessorKey: "createdAt",
//       header: "Date",
//       cell: (info: any) => new Date(info.getValue())?.toLocaleDateString(),
//     },
//     {
//       accessorKey: "total",
//       header: "Total",
//       cell: (info: any) => `$${info.getValue()?.toFixed(2)}`,
//     },
//     {
//       accessorKey: "paymentStatus",
//       header: "Payment Status",
//     },
//     {
//       accessorKey: "paymentMethod",
//       header: "Payment Method",
//     },
//     {
//       accessorKey: "actions",
//       header: "Actions",
//       cell: ({ row }) => (
//         <button
//           onClick={() => router.push(`/order/${row.original.id}`)}
//           className="text-blue-600 hover:underline text-xs flex items-center gap-1"
//         >
//           Track Order <ArrowUpRight className="w-3 h-3" />
//         </button>
//       ),
//     },
//   ];

//   // ✅ FIX: Create table correctly
//   const table = useReactTable({
//     data: data || [],
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   });

//   return (
//     <div className="w-full text-sm border-collapse">
//       {data?.length === 0 && (
//         <p className="text-center h-[30vh] items-center flex justify-center">
//           No orders found
//         </p>
//       )}

//       <table className="w-full text-sm border-collapse">
//         <thead>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <tr
//               key={headerGroup.id}
//               className="border-b border-b-gray-200 text-left"
//             >
//               {headerGroup.headers.map((header) => (
//                 <th
//                   key={header.id}
//                   className="p-2 px-3 font-semibold text-gray-800"
//                 >
//                   {flexRender(
//                     header.column.columnDef.header,
//                     header.getContext()
//                   )}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>

//         <tbody>
//           {table.getRowModel().rows.map((row) => (
//             <tr
//               key={row.id}
//               className="border-b border-b-gray-200 hover:bg-gray-50"
//             >
//               {row.getVisibleCells().map((cell) => (
//                 <td key={cell.id} className="p-2 px-3">
//                   {flexRender(
//                     cell.column.columnDef.cell,
//                     cell.getContext()
//                   )}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default OrderTable;
