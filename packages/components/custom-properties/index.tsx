import React, { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form';
import Input from '../input';
import { Plus } from 'lucide-react';
import { X } from 'lucide-react';

const CustomProperties = ({ control, errors }: any) => {
  const [properties, setProperties] = useState<{ label: string; values: string[] }[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");


  // const { fields, append, remove } = useFieldArray({
  //   control,
  //   name: "custom_specifications",
  // });

  return (
    <>
      <div className="flex flex-col gap-3">
        <Controller
          name="custom_properties"
          control={control}
          render={({ field }) => {

            useEffect(() => {
              field.onChange(properties);
            }, [properties]);

            const addproperty = () => {
              if (!newLabel.trim()) return;
              setProperties([...properties, { label: newLabel, values: [] }]);
              setNewLabel("");
            };

            const addValue = (index: number) => {
              if (!newValue.trim()) return;
              const updatedProperties = [...properties];
              updatedProperties[index].values.push(newValue);
              setProperties(updatedProperties);
              setNewValue("");
            };

            const removeProperty = (index: number) => {
              setProperties(properties.filter((_, i) => i !== index));
            };

            return (
              <div className='mt-2'>
                <label className="block font-semibold text-gray-300 mb-1">
                  Custom Properties
                </label>
                <div className='flex flex-col gap-3'>
                  {/* Existing Properties */}
                  {properties.map((property, index) => (
                    <div key={index} className="border border-gray-700 p-3 rounded-lg bg-gray-900">
                      <div className='flex justify-between items-center mb-2'>
                        <span className="font-medium text-white">{property.label}</span>
                        <button
                          type="button"
                          onClick={() => removeProperty(index)}>
                          <X size={18} className="text-red-500 hover:text-red-700" />
                        </button>
                      </div>
                      {/* Add Values to property */}
                      <div className='flex items-center gap-2 mb-2'>
                        <input type='text' className='border outline-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full'
                          placeholder='Enter Value..'
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                        <button
                          type="button"
                          className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md'
                          onClick={() => addValue(index)}>
                          Add Value
                        </button>
                      </div>
                      {/* show values */}
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {property.values.map((val, i) => (
                          <span key={i} className='px-2 py-1 bg-gray-700 text-white rounded-md text-sm'>
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add New Property */}
                  <div className='flex items-center gap-2 mt-2'>
                    <input type='text' className='border outline-none border-gray-700 bg-gray-800 p-2 rounded-md text-white w-full'
                      placeholder='Enter property label(e.g.,Material, Warranty)'
                      onChange={(e: any) => setNewLabel(e.target.value)} />
                    <button
                      type="button"
                      className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md'
                      onClick={addproperty}>
                      <Plus size={20} /> Add Property
                    </button>
                  </div>
                </div>
                {errors.custom_properties && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.custom_properties.message as string}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </>
  );
};

export default CustomProperties;