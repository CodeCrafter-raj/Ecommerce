"use client";

import React, { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { Search, Eye, Edit, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import Link from "next/link";
// import BreadCrumbs from "apps/seller-ui/src/components/BreadCrumbs";

const fetchOrders = async () => {
  const response = await axiosInstance.get("/order/api/get-admin-orders");
  return response.data.orders;
};

const ordersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(() => [
    {
      accessorKey: "id",
      header: "OrderID",
      cell: ({ row }: any) => (
        <span className="text-white text-sm truncate">#{row.original.id.slice(-6).toUpperCase()}</span>
      ),
    },
    {
      accessorKey: "shop.name",
      header: "Shop",
      cell: ({ row }: any) => (
        <span className="text-white ">{row.original.shop?.name ?? "Unknown Shop"}</span>
      ),
    },
    {
      accessorKey: "user.name",
      header: "Buyer",
      cell: ({ row }: any) => (
        <span className="text-white ">{row.original.user?.name ?? "Guest"}</span>
      ),
    },

    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="text-white">${row.original.total}</span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded-full text0xs font-medium ${row.original.status === "Paid" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>{row.original.status}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: any) => {
        const date = new Date(row.original.createdAt).toLocaleDateString();
        return <span className="text-white text-sm">{date}</span>;
      },
    },

    {
      header: "Actions",
      cell: ({ row }: any) => (
        <Link href={`/orders/${row.original.id}`} className="text-blue-400 hover:text-blue-300 transition">
          <Eye size={20} />
        </Link>
      ),
    }
  ], []);

  const table = useReactTable({
    data: orders,
    columns,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">All Orders</h2>
      {/* <BreadCrumbs title=" All Orders" /> */}

      {/* Search bar */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded:md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input type="text" placeholder="Search orders..." className="bg-transparent border-none outline-none text-white"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}

      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading Orders...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left text-sm">
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
                <tr key={row.id} className="border-b border-gray-400 hover:bg-gray-900 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 text-sm">
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
        )}
        {isLoading && orders?.length === 0 && (
          <p className="text-center py-3 text-white">No orders found!</p>
        )}
      </div>
    </div>
  );
};

export default ordersTable;