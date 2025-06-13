import React from 'react';

export function FormCheckbox({ 
    label, 
    name, 
    checked, 
    onChange, 
    disabled = false,
    helpText = null
}) {
    return (
        <div className="relative flex items-start">
            <div className="flex items-center h-6">
                <input
                    id={name}
                    name={name}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={name} className="font-medium text-gray-700 cursor-pointer">
                    {label}
                </label>
                {helpText && (
                    <p className="text-gray-500">{helpText}</p>
                )}
            </div>
        </div>
    );
}