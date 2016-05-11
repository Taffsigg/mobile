import realm from '../database/realm';

export default function instantiate() {
  realm.write(() => {
    const hospitalDept = realm.create('ItemDepartment', {
      id: '111DI',
      name: 'Hospital',
      parentDepartment: undefined,
    });

    const pharmacyDept = realm.create('ItemDepartment', {
      id: '222DI',
      name: 'Pharmacy',
      parentDepartment: hospitalDept,
    });

    const antidoteCat = realm.create('ItemCategory', {
      id: '111CI',
      name: 'Antidote',
      parentCategory: undefined,
    });

    const antidoteSpecficCat = realm.create('ItemCategory', {
      id: '222CI',
      name: 'Antidote, specific',
      parentCategory: antidoteCat,
    });

    const antidoteNonSpecificCat = realm.create('ItemCategory', {
      id: '333CI',
      name: 'Antidote, non specific',
      parentCategory: antidoteCat,
    });

    for (let i = 1; i < 1000; i += 2) {
      const itemOne = realm.create('Item', {
        id: `${i}I`,
        code: `MI${i}`,
        name: `MockItem${i}`,
        defaultPackSize: 100,
        lines: [],
        typeOf: 'Drug',
        department: pharmacyDept,
        description: 'Super good at being an Item',
        category: antidoteSpecficCat,
      });

      const itemTwo = realm.create('Item', {
        id: `${i + 1}I`,
        code: `MI${i + 1}`,
        name: `MockItem${i + 1}`,
        defaultPackSize: 24,
        lines: [],
        typeOf: 'Drug',
        department: hospitalDept,
        description: 'Super good at being an Item',
        category: antidoteNonSpecificCat,
      });

      itemOne.lines.push({
        id: `${i}aLI`,
        item: itemOne,
        packSize: 12,
        numberOfPacks: 10,
        totalQuantity: 120,  // Should be kept consistent with packSize x numberOfPacks
        expiryDate: new Date(2016, 12, 31),
        batch: '100',
        costPrice: 0.50,
        sellPrice: 1.00,
      });
      itemOne.lines.push({
        id: `${i + 1}aLI`,
        item: itemOne,
        packSize: 100,
        numberOfPacks: 5000,
        totalQuantity: 500000,
        expiryDate: new Date(2017, 7, 31),
        batch: '200',
        costPrice: 2.50,
        sellPrice: 5.00,
      });
      itemTwo.lines.push({
        id: `${i}bLI`,
        item: itemTwo,
        packSize: 24,
        numberOfPacks: 100,
        totalQuantity: 2400,
        expiryDate: new Date(2020, 1, 31),
        batch: '300',
        costPrice: 0.10,
        sellPrice: 0.20,
      });
    }
  });
  // 10000 transactions on 100 items distributed over 1 year
  function newDate(currIndex, totalTrans) {
    const date = new Date();
    date.setYear(date.getFullYear() - 1);
    date.setDate(date.getDate() + 365 / totalTrans * currIndex);
    return date;
  }

  realm.write(() => {
    const name = realm.create('Name', {
      id: '1',
      name: 'Borg',
      code: 'borg1',
      phoneNumber: '08002674',
      billingAddress: undefined,
      type: 'Customer AND supplier',
      masterList: undefined,
      invoices: [],
    });

    const user = realm.create('User', {
      id: '1',
      username: 'chrisSussol',
      lastLogin: new Date(),
      firstName: 'Chris',
      lastName: 'Petty',
      email: 'Chris@Petty.com',
      password: 'password totally not stored as a string',
      salt: 'sodium chloride',
    });

    const transCat = realm.create('TransactionCategory', {
      id: '1',
      name: 'TransactionCategory 1',
      parentCategory: undefined,
    });

    const numberOfTransactions = 1000;
    const items = realm.objects('Item').sorted('id');
    let currItem = 0;

    for (let t = 0; t < numberOfTransactions; t++) {
      const transaction = realm.create('Transaction', {
        id: `t${t}`,
        serialNumber: t,
        otherParty: name,
        comment: 'comment is here',
        entryDate: newDate(t, numberOfTransactions),
        type: 'stock_out',
        status: 'cn',
        confirmDate: new Date(),
        enteredBy: user,
        theirRef: `borg${t}`, // An external reference code
        category: transCat,
        lines: [],
      });
      name.invoices.push(transaction);
      for (let i = 0; i < 10; i++) {
        transaction.lines.push({
          id: `t${t}i${i}`,
          itemLine: items[currItem].lines[i],
          packSize: 1,
          numberOfPacks: 1,
          invoice: transaction,
        });
        currItem++;
        currItem = currItem >= 100 ? 0 : currItem;
      }
    }
  });
}
