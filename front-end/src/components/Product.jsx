function Product({ marketContract, productId, signer }) {

    const buyProduct = async () => {
        try {
            await marketContract.connect(signer).buyProduct(product.id);
        } catch (err) {
            console.log(err);
        }
    }
  return (
    <>
    </>
  )
}

export default Product;