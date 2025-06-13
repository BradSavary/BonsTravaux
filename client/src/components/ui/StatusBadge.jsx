import React from 'react';
import { getStatusColors } from '../../../lib/TicketStatus.js';

export function StatusBadge({ status, size = "normal" }) {
    const colors = getStatusColors(status);
    
    // Taille du badge
    const sizeClasses = size === "small" 
        ? "px-2 py-0.5 text-xs" 
        : "px-3 py-1 text-sm";
    
    return (
        <span className={`inline-flex items-center rounded-full font-medium ${colors.light} ${colors.text} ${sizeClasses}`}>
            {status}
        </span>
    );
}