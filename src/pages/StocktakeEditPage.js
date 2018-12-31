/**
 * mSupply Mobile
 * Sustainable Solutions (NZ) Ltd. 2016
 */

import React from 'react';
import PropTypes from 'prop-types';
import { StocktakeEditExpansion } from './expansions/StocktakeEditExpansion';
import { PageButton, PageInfo, TextEditor, PageContentModal, ConfirmModal } from '../widgets';
import { GenericPage } from './GenericPage';
import { parsePositiveInteger, truncateString, sortDataBy } from '../utilities';
import {
  buttonStrings,
  modalStrings,
  navStrings,
  tableStrings,
  pageInfoStrings,
} from '../localization';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const DATA_TYPES_SYNCHRONISED = ['StocktakeItem', 'StocktakeBatch', 'ItemBatch', 'Item'];

const MODAL_KEYS = {
  COMMENT_EDIT: 'commentEdit',
  NAME_EDIT: 'nameEdit',
};

/**
 * Renders the page for displaying StocktakeEditPage.
 * @prop   {Realm}               database      App wide database.
 * @prop   {func}                navigateTo    CallBack for navigation stack.
 * @state  {Realm.Results}       items         the stocktakeItems of props.stocktake.
 */
export class StocktakeEditPage extends React.Component {
  constructor(props) {
    super(props);
    const { stocktake } = props;
    this.items = stocktake.items;
    this.state = {
      modalKey: null,
      isModalOpen: false,
      isResetModalOpen: false,
    };
    this.dataFilters = {
      searchTerm: '',
      sortBy: 'itemName',
      isAscending: true,
    };

    // Validate the current state of the stocktake, warn user about any issues with modal
    this.itemsOutdated = stocktake.itemsOutdated;
    if (!stocktake.isFinalised && this.itemsOutdated.length > 0) {
      this.state.isResetModalOpen = true;
    }
  }

  /**
   * Respond to the user editing the number in the ACTUAL QUANTITY column.
   * @param  {string} key           Should always be 'countedTotalQuantity'
   * @param  {object} stocktakeItem The stocktake item from the row being edited
   * @param  {string} newValue      The value the user entered in the cell
   * @return {none}
   */
  onEndEditing = (key, stocktakeItem, newValue) => {
    if (key !== 'countedTotalQuantity' || newValue === '') return;
    const quantity = parsePositiveInteger(newValue);
    if (quantity === null) return;

    stocktakeItem.setCountedTotalQuantity(this.props.database, quantity);
  };

  /**
   * Will reset all items contained in this.itemsBelowMinimum and
   * this.itemsOutdated and reset them.
   */
  onResetItemsConfirm = () => {
    const { stocktake, runWithLoadingIndicator } = this.props;
    this.setState({ isResetModalOpen: false });
    runWithLoadingIndicator(() => {
      stocktake.resetStocktakeItems(this.props.database, this.itemsOutdated);
      this.refreshData();
    });
  };

  getModalTitle = () => {
    const { NAME_EDIT, COMMENT_EDIT } = MODAL_KEYS;
    switch (this.state.modalKey) {
      default:
      case NAME_EDIT:
        return modalStrings.edit_the_stocktake_name;
      case COMMENT_EDIT:
        return modalStrings.edit_the_stocktake_comment;
    }
  };
  openModal = key => this.setState({ modalKey: key, isModalOpen: true });
  openCommentEditor = () => this.openModal(MODAL_KEYS.COMMENT_EDIT);
  openNameEditor = () => this.openModal(MODAL_KEYS.NAME_EDIT);
  closeModal = () => this.setState({ isModalOpen: false });

  updateDataFilters = (newSearchTerm, newSortBy, newIsAscending) => {
    // We use != null, which checks for both null or undefined (undefined coerces to null)
    if (newSearchTerm != null) this.dataFilters.searchTerm = newSearchTerm;
    if (newSortBy != null) this.dataFilters.sortBy = newSortBy;
    if (newIsAscending != null) this.dataFilters.isAscending = newIsAscending;
  };

  /**
   * Returns updated data according to searchTerm, sortBy and isAscending.
   */
  refreshData = (newSearchTerm, newSortBy, newIsAscending) => {
    this.updateDataFilters(newSearchTerm, newSortBy, newIsAscending);
    const { searchTerm, sortBy, isAscending } = this.dataFilters;
    const data = this.items.filtered(
      'item.name BEGINSWITH[c] $0 OR item.code BEGINSWITH[c] $0',
      searchTerm,
    );
    let sortDataType;
    switch (sortBy) {
      case 'itemCode':
      case 'itemName':
        sortDataType = 'string';
        break;
      case 'snapshotTotalQuantity':
      case 'countedTotalQuantity':
      case 'difference':
        sortDataType = 'number';
        break;
      default:
        sortDataType = 'realm';
    }
    this.setState({ data: sortDataBy(data, sortBy, sortDataType, isAscending) });
  };

  renderCell = (key, stocktakeItem) => {
    const isEditable = !this.props.stocktake.isFinalised;
    switch (key) {
      default:
        return stocktakeItem[key];
      case 'countedTotalQuantity': {
        let cellContents;
        if (!stocktakeItem.hasCountedBatches) {
          // If not editable (i.e. finalised) we want to show 0 rather than '' as
          // placeholder isn't shown
          cellContents = isEditable ? '' : 0;
        } else {
          cellContents = stocktakeItem.countedTotalQuantity;
        }
        // If finalised we want to show 0 rather than '' as placeholder isn't shown
        return {
          type: isEditable ? 'editable' : 'text',
          cellContents,
          placeholder: tableStrings.not_counted,
        };
      }
      case 'difference': {
        const difference = stocktakeItem.difference;
        const prefix = difference > 0 ? '+' : '';
        return { cellContents: `${prefix}${difference}` };
      }
    }
  };

  renderManageStocktakeButton = () => (
    <PageButton
      text={buttonStrings.manage_stocktake}
      onPress={() =>
        this.props.navigateTo('stocktakeManager', navStrings.manage_stocktake, {
          stocktake: this.props.stocktake,
        })
      }
      isDisabled={this.props.stocktake.isFinalised}
    />
  );

  renderExpansion = stocktakeItem => (
    <StocktakeEditExpansion
      stocktakeItem={stocktakeItem}
      database={this.props.database}
      genericTablePageStyles={this.props.genericTablePageStyles}
    />
  );

  renderModalContent = () => {
    const { NAME_EDIT, COMMENT_EDIT } = MODAL_KEYS;
    const { stocktake, database } = this.props;
    switch (this.state.modalKey) {
      default:
      case COMMENT_EDIT:
        return (
          <TextEditor
            text={stocktake.comment}
            onEndEditing={newComment => {
              if (newComment !== stocktake.comment) {
                database.write(() => {
                  stocktake.comment = newComment;
                  database.save('Stocktake', stocktake);
                });
              }
              this.closeModal();
            }}
          />
        );
      case NAME_EDIT:
        return (
          <TextEditor
            text={stocktake.name}
            onEndEditing={newName => {
              if (newName !== stocktake.name) {
                database.write(() => {
                  stocktake.name = newName;
                  database.save('Stocktake', stocktake);
                });
              }
              this.closeModal();
            }}
          />
        );
    }
  };

  renderPageInfo = () => {
    const { name, comment, isFinalised } = this.props.stocktake;
    const infoColumns = [
      [
        {
          title: `${pageInfoStrings.stocktake_name}:`,
          info: name,
          onPress: this.openNameEditor,
          editableType: 'text',
        },
        {
          title: `${pageInfoStrings.comment}:`,
          info: comment,
          onPress: this.openCommentEditor,
          editableType: 'text',
        },
      ],
    ];
    return <PageInfo columns={infoColumns} isEditingDisabled={isFinalised} />;
  };

  render() {
    const { data, isResetModalOpen, isModalOpen } = this.state;
    const resetModalText = isResetModalOpen // small optimisation,
      ? modalStrings.stocktake_invalid_stock + formatErrorItemNames(this.itemsOutdated)
      : '';

    return (
      <KeyboardAwareScrollView>
        <GenericPage
          data={data}
          refreshData={this.refreshData}
          renderCell={this.renderCell}
          renderExpansion={this.renderExpansion}
          renderTopRightComponent={this.renderManageStocktakeButton}
          renderTopLeftComponent={this.renderPageInfo}
          onEndEditing={this.onEndEditing}
          defaultSortKey={this.dataFilters.sortBy}
          defaultSortDirection={this.dataFilters.isAscending ? 'ascending' : 'descending'}
          columns={[
            {
              key: 'itemCode',
              width: 1,
              title: tableStrings.item_code,
              sortable: true,
              alignText: 'right',
            },
            {
              key: 'itemName',
              width: 3.2,
              title: tableStrings.item_name,
              sortable: true,
            },
            {
              key: 'snapshotTotalQuantity',
              width: 1.2,
              title: tableStrings.snapshot_quantity,
              sortable: true,
              alignText: 'right',
            },
            {
              key: 'countedTotalQuantity',
              width: 1.2,
              title: tableStrings.actual_quantity,
              sortable: true,
              alignText: 'right',
            },
            {
              key: 'difference',
              width: 1,
              title: tableStrings.difference,
              sortable: true,
              alignText: 'right',
            },
          ]}
          dataTypesSynchronised={DATA_TYPES_SYNCHRONISED}
          dataTypesLinked={['StocktakeBatch']}
          finalisableDataType={'Stocktake'}
          database={this.props.database}
          {...this.props.genericTablePageStyles}
          topRoute={this.props.topRoute}
        >
          <PageContentModal
            isOpen={isModalOpen && !this.props.stocktake.isFinalised}
            onClose={this.closeModal}
            title={this.getModalTitle()}
          >
            {this.renderModalContent()}
          </PageContentModal>
          <ConfirmModal
            coverScreen
            noCancel
            isOpen={isResetModalOpen}
            questionText={resetModalText}
            onConfirm={this.onResetItemsConfirm}
          />
        </GenericPage>
      </KeyboardAwareScrollView>
    );
  }
}

StocktakeEditPage.propTypes = {
  database: PropTypes.object,
  genericTablePageStyles: PropTypes.object,
  navigateTo: PropTypes.func.isRequired,
  runWithLoadingIndicator: PropTypes.func.isRequired,
  stocktake: PropTypes.object.isRequired,
  topRoute: PropTypes.bool,
};

// This is redundant in stocktake now, as stock movement check when opening the stocktake
// Should ensure snapshot is never an old value, so negative adjustments aren't possible.
// Leaving for now as a fail safe.
/**
 * Check whether a given stocktake is safe to be finalised. Return null if it is,
 * otherwise return an appropriate error message if not.
 * @param  {object}  stocktake  The stocktake to check
 * @return {string}  An error message if not able to be finalised
 */
export function checkForFinaliseError(stocktake) {
  if (!stocktake.hasSomeCountedItems) return modalStrings.stocktake_no_counted_items;
  const itemsBelowMinimum = stocktake.itemsBelowMinimum;
  if (itemsBelowMinimum.length > 0) {
    return (
      modalStrings.following_items_reduced_more_than_available_stock +
      formatErrorItemNames(itemsBelowMinimum)
    );
  }
  return null;
}

function formatErrorItemNames(items) {
  const MAX_ITEMS_IN_ERROR_MESSAGE = 4; // Number of items to display in finalise error modal
  const MAX_ITEM_STRING_LENGTH = 40; // Length of string representing item in error modal
  let itemsString = '';
  items.forEach((item, index) => {
    if (!item) return; // re-render can cause crash here sometimes
    if (index >= MAX_ITEMS_IN_ERROR_MESSAGE) return;
    itemsString += truncateString(`\n${item.itemCode} - ${item.itemName}`, MAX_ITEM_STRING_LENGTH);
  });
  if (items.length > MAX_ITEMS_IN_ERROR_MESSAGE) {
    itemsString +=
      `\n${modalStrings.and} ` +
      `${items.length - MAX_ITEMS_IN_ERROR_MESSAGE} ` +
      `${modalStrings.more}.`;
  }
  return itemsString;
}
