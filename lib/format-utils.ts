import type { Recibo } from "./types"

/**
 * Check if a value is null, undefined, empty string, or the string "null"
 */
function isNullish(value: string | null | undefined): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "undefined" ||
    value.trim() === ""
  )
}

/**
 * Format currency values to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Format date to Brazilian Portuguese
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }

  return new Date(date).toLocaleDateString("pt-BR", options || defaultOptions)
}

/**
 * Safely get establishment name with fallback
 */
export function getEstablishmentName(recibo: Recibo): string {
  if (!isNullish(recibo.nome_estabelecimento)) {
    return capitalizeWords(recibo.nome_estabelecimento!.trim())
  }
  return "Não Informado"
}

/**
 * Safely get establishment type with fallback
 */
export function getEstablishmentType(recibo: Recibo): string {
  if (!isNullish(recibo.tipo_estabelecimento)) {
    return capitalizeWords(recibo.tipo_estabelecimento!.trim())
  }
  return "Outros"
}

/**
 * Safely get payment method with fallback
 */
export function getPaymentMethod(recibo: Recibo): string {
  if (!isNullish(recibo.metodo_pagamento)) {
    return capitalizeWords(recibo.metodo_pagamento!.trim())
  }
  return "Não Informado"
}

/**
 * Check if establishment name is available
 */
export function hasEstablishmentName(recibo: Recibo): boolean {
  return !isNullish(recibo.nome_estabelecimento)
}

/**
 * Check if establishment type is available
 */
export function hasEstablishmentType(recibo: Recibo): boolean {
  return !isNullish(recibo.tipo_estabelecimento)
}

/**
 * Check if payment method is available
 */
export function hasPaymentMethod(recibo: Recibo): boolean {
  return !isNullish(recibo.metodo_pagamento)
}

/**
 * Check if items are available
 */
export function hasItems(recibo: Recibo): boolean {
  return !isNullish(recibo.itens_comprados)
}

/**
 * Get items with fallback
 */
export function getItems(recibo: Recibo): string {
  if (!isNullish(recibo.itens_comprados)) {
    return capitalizeWords(recibo.itens_comprados!.trim())
  }
  return "Sem Detalhes"
}

/**
 * Get unique values from array, filtering out null/empty values and string "null"
 * Capitalizes string values for consistency
 */
export function getUniqueValues<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(
    new Set(
      arr
        .filter((item): item is T => {
          if (item === null || item === undefined) return false
          if (typeof item === 'string') {
            return !isNullish(item)
          }
          return true
        })
        .map(item => typeof item === 'string' ? capitalizeWords(item.trim()) : item)
    )
  ) as T[]
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
