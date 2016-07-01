import Realm from 'realm';

export class TransactionItem extends Realm.Object {
  get totalQuantity() {
    const total = this.lines.reduce((sum, line) => sum + line.totalQuantity, 0);
    return total;
  }

  get totalQuantitySent() {
    const total = this.lines.reduce((sum, line) => sum + line.totalQuantitySent, 0);
    return total;
  }

  getTotal(key) {
    const total = this.lines.reduce((sum, line) => sum + line[key], 0);
    return total;
  }

  /**
   * Sets the quantity for the current item by applying the difference to the
   * shortest expiry batches possible. N.B. Supplier invoices do not take effect
   * on the rest of the stock until they are finalised, whereas customer invoices
   * immediately influence stock levels.
   * @param {double} quantity The total quantity to set across all lines
   */
  set totalQuantity(quantity) {
    if (this.transaction.type === 'supplier_invoice') {
      let quantityToSubtract = this.totalQuantity - quantity;
      const lines = this.lines.sorted('expiryDate');
      const index = 0;
      while (quantityToSubtract !== 0 && index < lines.length) {
        const toSubtractFromThisLine = Math.min(quantityToSubtract, lines[index].totalQuantity);
        lines[index].totalQuantity = lines[index].totalQuantity - toSubtractFromThisLine;
        quantityToSubtract = quantityToSubtract - toSubtractFromThisLine;
      }
    } else { // This is a customer invoice, need to deal with adding and deleting lines
      if (quantity > this.item.totalQuantity) {
        throw new Error('Cannot issue more stock than available.');
      }
      // TODO organise allocating quantity to lines for customer invoices
    }
  }
}
