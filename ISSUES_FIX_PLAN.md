# Issues Fix Plan
1. **Tables Page**: After marking a table as unavailable, it cannot be changed back to available.
    - [x] Verified backend logic. `updateTable` allows status updates.
    - [x] Frontend Edit Modal allows status change.
    - [x] Note: If active order exists, table might revert to OCCUPIED or prevent status change depending on flow. User should ensure order is completed/cancelled first.

2. **Users Page**: Need to fix/improve "Edit", "Delete", "Activate", "Deactivate" buttons.
    - [x] Added `deleteUser` to backend (Controller & Route).
    - [x] Added `handleDelete` to `Users.jsx`.
    - [x] Improved button styling with SVGs for better mobile experience.

3. **Order Page**: "New Order" button is going out of the application grid in mobile view.
    - [x] Adjusted `Orders.jsx` header layout for mobile (flex-col, gap adjustments).

4. **Inventory Page**:
    - [x] Added "Export CSV" option.
    - [x] Added "Last Restocked Date" field to "Add/Edit Item" modal.
    - [x] Updated backend to respect manual `lastRestocked` date.
    - [x] Fixed "Add Inventory" pop-up centering (added `z-index`, `m-auto`).

5. **Reports CSV**: Customer name and mobile number integration.
    - [x] Backend `exportReportToCSV` updated to include customer details.

6. **Login Page**: "Invalid Credentials" message persists.
    - [x] Added `clearError` to `authStore`.
    - [x] Implemented error clearing on input change in `Login.jsx`.

7. **Logo**: Replace restaurant name with logo.
    - [x] Added logo to `Layout.jsx` and `Login.jsx` alongside text as requested.

8. **Cart Page**: Add Customer Name and Mobile Number input fields.
    - [x] Verified fields exist in `Cart.jsx`.
    - [x] Verified backend `createOrder` handles these fields.

9. **Menu Page**: Unable to make unavailable items available again.
    - [x] Fixed z-index issue where "Unavailable" overlay was blocking admin buttons. Moved admin controls above the overlay.

## Next Steps
- Run the application and verify all fixes.
- Test the "Export CSV" functionality.
- Test the "Delete User" functionality.
- Check mobile responsiveness for Orders and Inventory pages.
