/**
 * Plates are stored as plain upper-case letters and digits ("TM54ATM"), whatever spacing
 * people type ("tm 54-atm"). Mirrors `normalizePlate` in the backend.
 */
export const normalizePlate = (value: string) => value.replace(/[\s-]/g, '').toUpperCase()
