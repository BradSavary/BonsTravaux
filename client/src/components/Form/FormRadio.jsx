import React from 'react';

export function FormRadio({ 
    label, 
    name, 
    value,
    checkedValue, 
    onChange, 
    disabled = false,
    helpText = null,
    description = null
}) {
    const isChecked = value === checkedValue;
    
    return (
        <div className="relative flex items-start">
            <div className="flex items-center h-6">
                <input
                    id={`${name}-${value}`}
                    name={name}
                    type="radio"
                    value={value}
                    checked={isChecked}
                    onChange={onChange}
                    disabled={disabled}
                    className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={`${name}-${value}`} className="font-medium text-gray-700 cursor-pointer">
                    {label}
                </label>
                {description && (
                    <p className="text-gray-500 mt-1">{description}</p>
                )}
                {helpText && (
                    <p className="text-gray-500 mt-1">{helpText}</p>
                )}
            </div>
        </div>
    );
}