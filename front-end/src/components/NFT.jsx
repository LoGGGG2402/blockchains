function NFT({ image, name, description, owner }){
    return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4 bg-white">
      <img className="w-full h-48 object-cover" src={image} alt={name} />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{name}</div>
        <p className="text-gray-700 text-base">{description}</p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <span className="block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 mr-2 mb-2">
          Owner: {owner}
        </span>
      </div>
    </div>
  );
}

export default NFT;