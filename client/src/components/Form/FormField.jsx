import React from 'react';

export function FormField({ 
    label, 
    name, 
    value, 
    onChange, 
    type = 'text', 
    disabled = false, 
    required = false, 
    placeholder = '', 
    icon = null,
    helpText = null 
}) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative rounded-md shadow-sm">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    id={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 sm:text-sm border border-gray-300 rounded-lg shadow-sm
                        ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
                        focus:ring-blue-500 focus:border-blue-500`}
                />
            </div>
            {helpText && (
                <p className="mt-1 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );
}