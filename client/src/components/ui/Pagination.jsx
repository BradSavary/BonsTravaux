import React from 'react';

export function Pagination({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    siblingCount = 1,
    className = "" 
}) {
    // Générer la liste des pages à afficher
    const getPageNumbers = () => {
        const pages = [];
        const totalNumbers = siblingCount * 2 + 3; // Les numéros de page à afficher 
        const totalButtons = Math.min(totalNumbers, totalPages);

        // Cas simple: si le nombre total de pages est inférieur au nombre de boutons à afficher
        if (totalPages <= totalButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // Calculer les positions de début et de fin
        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        // Ne pas montrer les points si une seule page est cachée
        const showLeftDots = leftSiblingIndex > 2;
        const showRightDots = rightSiblingIndex < totalPages - 1;

        // Toujours afficher la première et la dernière page
        if (showLeftDots && showRightDots) {
            // Afficher première, dernière, et pages autour de la page actuelle
            pages.push(1);
            if (showLeftDots) pages.push('...');
            for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
                pages.push(i);
            }
            if (showRightDots) pages.push('...');
            pages.push(totalPages);
        } else if (!showLeftDots && showRightDots) {
            // Pas de points à gauche, mais des points à droite
            for (let i = 1; i <= rightSiblingIndex; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else {
            // Pas de points à droite, mais des points à gauche
            pages.push(1);
            pages.push('...');
            for (let i = leftSiblingIndex; i <= totalPages; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
        <nav className={`flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 py-3 ${className}`}>
            <div className="hidden md:flex flex-1 justify-between items-center">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
                        ${currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'}`}
                >
                    Précédent
                </button>

                <div className="flex items-center space-x-2">
                    {pageNumbers.map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-2 py-1 text-gray-500">...</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium 
                                        ${currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
                        ${currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'}`}
                >
                    Suivant
                </button>
            </div>

            {/* Version mobile */}
            <div className="flex md:hidden items-center justify-between w-full">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md px-2 py-2 text-sm font-medium
                        ${currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                >
                    <span className="sr-only">Précédent</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
                </p>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-md px-2 py-2 text-sm font-medium
                        ${currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                >
                    <span className="sr-only">Suivant</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}