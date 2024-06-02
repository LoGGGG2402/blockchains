import React from 'react';

function NFT({image, name, description, owner}) {
    return (
        <div
            className="flex w-64 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 font-semibold shadow-lg m-4 bg-white">
            <div className="h-64 w-full flex items-center justify-center overflow-hidden bg-gray-100">
                <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                    style={{maxWidth: '100%', maxHeight: '100%'}}
                />
            </div>
            <div className="flex flex-col p-4">
                <p className="text-lg text-center font-bold mb-1 truncate text-gray-900">{name}</p>
                <span className="text-sm font-normal mb-1 truncate text-gray-600">Description: {description}</span>
                <span className="text-sm font-normal text-gray-600 truncate max-w-full inline-block">
                    Owner: {owner}
                </span>
            </div>
        </div>
    );
}

export default NFT;
