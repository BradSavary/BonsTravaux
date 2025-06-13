import React from 'react';

export function FormSelect({ 
    label, 
    name, 
    value, 
    onChange, 
    options = [], 
    disabled = false, 
    required = false, 
    placeholder = 'Sélectionnez une option', 
    loading = false,
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
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled || loading}
                    required={required}
                    className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-10 py-2.5 sm:text-sm border border-gray-300 rounded-lg shadow-sm
                        ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
                        focus:ring-blue-500 focus:border-blue-500 appearance-none`} // Ajout de appearance-none
                >
                    <option value="">{loading ? "Chargement..." : placeholder}</option>
                    {options.map((option, idx) => (
                        <option key={option.value || idx} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            {helpText && (
                <p className="mt-1 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );
}