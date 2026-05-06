import React from 'react'
const StatCard = ({ title, count, Icon }: any) => {
  return (
    <div className=' bg-white p-5 rounded-md shadow-sm border border-gray-100 flex items-center justify-between'>
      <div>
        <h3 className='text-sm text-gray-500'>{title}</h3>
        <p className='text-gray-800 text-2xl font-bold'>{count}</p>
      </div>
      <div>
        <Icon className='w-10 h-10 text-blue-600' />
      </div>
    </div>
  )
}
export default StatCard