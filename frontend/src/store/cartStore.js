import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            tableId: null,
            tableNumber: null,
            orderType: 'DINE_IN',
            customerName: '',
            customerPhone: '',

            setTableId: (id, number = null) => set({ tableId: id, tableNumber: number }),
            setOrderType: (type) => set({ orderType: type }),
            setCustomerDetails: (name, phone) => set({ customerName: name, customerPhone: phone }),

            addItem: (item, variant = null, quantity = 1, notes = '') => {
                const currentItems = get().items;
                const existingItemIndex = currentItems.findIndex(
                    (i) => i.menuItemId === item.id && i.variantId === variant?.id
                );

                if (existingItemIndex > -1) {
                    const newItems = [...currentItems];
                    newItems[existingItemIndex].quantity += quantity;
                    set({ items: newItems });
                } else {
                    set({
                        items: [
                            ...currentItems,
                            {
                                menuItemId: item.id,
                                name: item.name,
                                variantId: variant?.id,
                                variantName: variant?.name,
                                price: variant ? variant.price : item.price,
                                quantity,
                                notes,
                            },
                        ],
                    });
                }
            },

            removeItem: (index) => {
                const newItems = [...get().items];
                newItems.splice(index, 1);
                set({ items: newItems });
            },

            updateQuantity: (index, quantity) => {
                const newItems = [...get().items];
                if (quantity > 0) {
                    newItems[index].quantity = quantity;
                    set({ items: newItems });
                } else {
                    get().removeItem(index);
                }
            },

            clearCart: () => set({
                items: [],
                tableId: null,
                tableNumber: null,
                customerName: '',
                customerPhone: ''
            }),

            getTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);

export default useCartStore;
