import { SKU, Product } from '../typings/product'
import { path, propEq, find } from 'ramda'

type SetQuantityAction = { type: 'SET_QUANTITY', args: { quantity: number } }
type SkuSelectorSetVariationsSelectedAction = { type: 'SKU_SELECTOR_SET_VARIATIONS_SELECTED', args: { allSelected: boolean } }
type SetSelectedItemAction = { type: 'SET_SELECTED_ITEM', args: { item: SKU } }
type SetAssemblyOptionsAction = { type: 'SET_ASSEMBLY_OPTIONS', args: { groupId: string, groupItems: AssemblyOptionItem[], groupInputValues: AttachmentField[], isValid: boolean } }
type SetProductAction = { type: 'SET_PRODUCT', args: { product: Product } }

export type ProductContextAction = (
  | SetQuantityAction
  | SkuSelectorSetVariationsSelectedAction
  | SetSelectedItemAction
  | SetAssemblyOptionsAction
  | SetProductAction
)

export type ProductContextDispatch = (action: ProductContextAction) => void

type GroupTypes = 'SINGLE' | 'TOGGLE' | 'MULTIPLE'

interface AssemblyOptionItem {
  price: number
  choiceType: GroupTypes
  children: Record<string, BuyButtonItem[]> | null
  name: string
  id: string
  initialQuantity: number
  quantity: number
  seller: string
}

interface BuyButtonItem {
  name: string
  id: string
  initialQuantity: number
  quantity: number
  seller: string
  price: number
  choiceType: GroupTypes
  children: Record<string, BuyButtonItem[]> | null
}

type AttachmentField = TextAttachment | BooleanAttachment | OptionsAttachment

interface TextAttachment {
  label: string
  maxLength: number
  type: 'TEXT'
  domain: null
}

interface BooleanAttachment {
  label: string
  maxLength: null
  type: 'BOOLEAN'
  domain: null
}

interface OptionsAttachment {
  label: string
  maxLength: null
  type: 'OPTIONS'
  domain: string[]
}

interface ProductContextState {
  product?: Product,
  selectedItem: SKU | null,
  selectedQuantity: number
  skuSelector: {
    areAllVariationsSelected: boolean
  },
  assemblyOptions: {
    items: Record<string, AssemblyOptionItem[]>
    inputValues: Record<string, AttachmentField[]>
    areGroupsValid: Record<string, boolean>
  }
}

const defaultState: ProductContextState = {
  product: undefined,
  selectedItem: null,
  selectedQuantity: 1,
  skuSelector: {
    areAllVariationsSelected: true,
  },
  assemblyOptions: {
    items: {},
    inputValues: {},
    areGroupsValid: {},
  },
}

const findItemById = (id: string) => find(propEq('itemId', id))
function findAvailableProduct(item: SKU) {
  return item.sellers.find(
    ({ commertialOffer = { AvailableQuantity: 0 } }) => commertialOffer.AvailableQuantity > 0
  )
}

interface InitReducerParams {
  query: {
    skuId: string | null,
  }
  items: SKU[] | []
  product: Product|undefined
}

export function initReducer({ query, items, product }: InitReducerParams): ProductContextState {
  return {
    ...defaultState,
    selectedItem: getSelectedItem(query.skuId, items),
    product,
  }
}

export function getSelectedItem(skuId: string|null, items: SKU[]) {
  return skuId
    ? findItemById(skuId)(items)
    : items.find(findAvailableProduct) || items[0]
}

export function reducer(state: ProductContextState, action: ProductContextAction): ProductContextState {
  switch (action.type) {
    case 'SET_QUANTITY':
      return {
        ...state,
        selectedQuantity: action.args.quantity,
      }
    case 'SKU_SELECTOR_SET_VARIATIONS_SELECTED': {
      return {
        ...state,
        skuSelector: {
          ...state.skuSelector,
          areAllVariationsSelected: action.args.allSelected,
        },
      }
    }
    case 'SET_SELECTED_ITEM': {
      return {
        ...state,
        selectedItem: action.args.item,
      }
    }
    case 'SET_ASSEMBLY_OPTIONS': {
      const { groupId, groupItems, groupInputValues, isValid } = action.args
      return {
        ...state,
        assemblyOptions: {
          ...state.assemblyOptions,
          inputValues: {
            ...state.assemblyOptions.inputValues,
            [groupId]: groupInputValues,
          },
          items: {
            ...state.assemblyOptions.items,
            [groupId]: groupItems,
          },
          areGroupsValid: {
            ...state.assemblyOptions.areGroupsValid,
            [groupId]: isValid,
          },
        },
      }
    }

    case 'SET_PRODUCT': {
      const differentSlug =
        path(['product', 'linkText'], state) !==
        path(['product', 'linkText'], action.args)
      return {
        ...state,
        product: action.args.product,
        ...(differentSlug ? defaultState : {}),
      }
    }
    default:
      return state
  }
}