import React, { useMemo, useReducer, useEffect, FC, ReactElement } from 'react'
import { ProductOpenGraph } from 'vtex.open-graph'
import { ProductContext as ProductContextApp } from 'vtex.product-context'
import { ProductDispatchContext } from 'vtex.product-context/ProductDispatchContext'

import StructuredData from './components/StructuredData'
import WrapperContainer from './components/WrapperContainer'

import ProductTitleAndPixel from './components/ProductTitleAndPixel'
import { Product } from './typings/product'
import { reducer, initReducer, getSelectedItem, ProductContextDispatch } from './components/ProductContextReducer'

function useProductInState(product: Product|undefined, dispatch: ProductContextDispatch) {
  useEffect(() => {
    if (product) {
      dispatch({
        type: 'SET_PRODUCT',
        args: { product },
      })
    }
  }, [product, dispatch])
}
 
function useSelectedItemFromId(skuId: string|null, dispatch: ProductContextDispatch, product: Product|undefined) {
  useEffect(() => {
    const items = (product && product.items) || []
    dispatch({
      type: 'SET_SELECTED_ITEM',
      args: { item: getSelectedItem(skuId, items) },
    })
  }, [dispatch, skuId, product])
}

interface Props {
  children: ReactElement
  params: {
    slug: string
  },
  productQuery: {
    product: Product
    loading: boolean
  },
  query: {
    skuId: string | null
  }
}

const ProductWrapper: FC<Props> = ({
  params: { slug },
  productQuery,
  productQuery: { product, loading } = { loading: true },
  query,
  children,
  ...props
}) => {
  const items = product && product.items ? product.items : []

  const [state, dispatch] = useReducer(
    reducer,
    { query, items, product },
    initReducer
  )

  // These hooks are used to keep the state in sync with API data, specially when switching between products without exiting the product page
  useProductInState(product, dispatch)
  useSelectedItemFromId(query.skuId, dispatch, product)

  const { selectedItem } = state

  const childrenProps = useMemo(
    () => ({
      productQuery,
      slug,
      ...props,
    }),
    [productQuery, slug, props]
  )

  return (
    <WrapperContainer className="vtex-product-context-provider">
      <ProductTitleAndPixel
        product={product}
        selectedItem={selectedItem}
        loading={loading}
      />
      <ProductContextApp.Provider value={state}>
        <ProductDispatchContext.Provider value={dispatch}>
          {product && <ProductOpenGraph />}
          {product && selectedItem && (
            <StructuredData product={product} selectedItem={selectedItem} />
          )}
          {React.cloneElement(children, childrenProps)}
        </ProductDispatchContext.Provider>
      </ProductContextApp.Provider>
    </WrapperContainer>
  )
}

export default ProductWrapper
