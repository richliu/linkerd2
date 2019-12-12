import CloseIcon from '@material-ui/icons/Close';
import EmptyCard from './EmptyCard.jsx';
import FilterListIcon from '@material-ui/icons/FilterList';
import Hidden from '@material-ui/core/Hidden';
import Paper from '@material-ui/core/Paper';
import PropTypes from 'prop-types';
import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import _find from 'lodash/find';
import _get from 'lodash/get';
import _isNil from 'lodash/isNil';
import _orderBy from 'lodash/orderBy';
import classNames from 'classnames';
import { regexFilterString } from './util/Utils.js';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    overflowX: 'auto',
  },
  tableHeader: {
    fontSize: "12px",
    opacity: 0.6,
  },
  tableHeaderActive: {
    fontSize: "12px",
    opacity: 1,
  },
  activeSortIcon: {
    opacity: 1,
  },
  toolbar: {
    paddingLeft: "24px"
  },
  toolbarIcon: {
    cursor: "pointer",
    opacity: 0.8
  },
  sortIcon: {
    fontSize: "16px",
    opacity: 0.4,
  },
  denseTable: {
    paddingRight: "8px",
    "&:last-child": {
      paddingRight: "24px",
    },
  },
  title: {
    flexGrow: 1
  }
});

class BaseTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      order: this.props.defaultOrder || "asc",
      orderBy: this.props.defaultOrderBy,
      filterBy: ""
    };
    this.handleFilterInputChange = this.handleFilterInputChange.bind(this);
    this.handleFilterToggle = this.handleFilterToggle.bind(this);
  }

  createSortHandler = col => () => {
    let orderBy = col.dataIndex;
    let order = col.defaultSortOrder || 'asc';

    if (this.state.orderBy === orderBy && this.state.order === order) {
      order = order === 'asc' ? 'desc' : 'asc';
    }

    this.setState({ order, orderBy });
  };

  handleFilterInputChange = event => {
    this.setState({ filterBy: regexFilterString(event.target.value) });
  }

  handleFilterToggle = () => {
    let newFilterStatus = !this.state.showFilter;
    this.setState({ showFilter: newFilterStatus, filterBy: "" });
  }

  generateRows = (tableRows, tableColumns, order, orderBy, filterBy) => {
    let rows = tableRows;
    let col = _find(tableColumns, d => d.dataIndex === orderBy);

    if (orderBy && col.sorter) {
      rows = _orderBy(rows, row => col.sorter(row), order);
    }
    if (filterBy) {
      let columnsToFilter = tableColumns.filter(col => col.filter);
      let filteredRows = rows.filter(row => {
        return columnsToFilter.some(col => {
          let rowText = col.filter(row);
          return rowText.match(filterBy);
        });
      });
      rows = filteredRows;
    }

    return rows;
  }

  renderHeaderCell = (col, order, orderBy) => {
    let active = orderBy === col.dataIndex;
    const { classes, padding } = this.props;
    let tableCell;

    if (col.sorter) {
      tableCell = (
        <TableCell
          key={col.key || col.dataIndex}
          align={col.isNumeric ? "right" : "left"}
          sortDirection={orderBy === col.dataIndex ? order : false}
          classes={{
            root: active ? classes.tableHeaderActive : classes.tableHeader,
          }}
          className={classNames({[classes.denseTable]: padding === 'dense'})}>
          <TableSortLabel
            active={active}
            direction={active ? order : col.defaultSortOrder || 'asc'}
            classes={{
              icon: classes.sortIcon,
              active: classes.activeSortIcon,
            }}
            onClick={this.createSortHandler(col)}>
            {col.title}
          </TableSortLabel>
        </TableCell>
      );
    } else {
      tableCell = (
        <TableCell
          key={col.key || col.dataIndex}
          align={col.isNumeric ? "right" : "left"}
          className={classNames(
            {[classes.denseTable]: padding === 'dense'},
            classes.tableHeader,
          )}>
          {col.title}
        </TableCell>
      );
    }

    return _isNil(col.tooltip) ? tableCell :
    <Tooltip key={col.key || col.dataIndex} placement="top" title={col.tooltip}>{tableCell}</Tooltip>;
  }

  renderToolbar = (classes, title) => {
    return (
      <Toolbar className={classes.toolbar}>
        <Typography
          className={classes.title}
          variant="h5">
          {title}
        </Typography>
        {this.state.showFilter &&
          <TextField
            id="input-with-icon-textfield"
            onChange={this.handleFilterInputChange}
            placeholder="Filter by text"
            autoFocus />}
        {!this.state.showFilter &&
        <Hidden smDown>
          <FilterListIcon
            className={classes.toolbarIcon}
            onClick={this.handleFilterToggle} />
        </Hidden>}
        {this.state.showFilter &&
          <CloseIcon
            className={classes.toolbarIcon}
            onClick={this.handleFilterToggle} />}
      </Toolbar>
    );
  }

  render() {
    const { classes, enableFilter, tableRows, tableColumns, tableClassName, title, rowKey, padding} = this.props;
    const {order, orderBy, filterBy} = this.state;
    const sortedTableRows = tableRows.length > 0 ? this.generateRows(tableRows, tableColumns, order, orderBy, filterBy) : tableRows;

    return (
      <Paper className={classes.root}>
        {enableFilter &&
          this.renderToolbar(classes, title)}
        <Table className={`${classes.table} ${tableClassName}`}>
          <TableHead>
            <TableRow>
              { tableColumns.map(c => (
                this.renderHeaderCell(c, order, orderBy)
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            { sortedTableRows.length > 0 && (
              <React.Fragment>
                {
                  sortedTableRows.map(d => {
                  let key = !rowKey ? d.key : rowKey(d);
                  let tableRow = (
                    <TableRow key={key}>
                      { tableColumns.map(c => (
                        <TableCell
                          className={classNames({[classes.denseTable]: padding === 'dense'})}
                          key={`table-${key}-${c.key || c.dataIndex}`}
                          align={c.isNumeric ? "right" : "left"}>
                          {c.render ? c.render(d) : _get(d, c.dataIndex)}
                        </TableCell>
                        )
                      )}
                    </TableRow>
                  );
                  return _isNil(d.tooltip) ? tableRow :
                  <Tooltip key={`table-row-${key}`} placement="left" title={d.tooltip}>{tableRow}</Tooltip>;
                  }
                )}
              </React.Fragment>
            )}
          </TableBody>
        </Table>

        { sortedTableRows.length === 0 && (
          <EmptyCard />
        )}
      </Paper>
    );
  }
}

BaseTable.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  defaultOrder: PropTypes.string,
  defaultOrderBy: PropTypes.string,
  enableFilter: PropTypes.bool,
  padding: PropTypes.string,
  rowKey: PropTypes.func,
  tableClassName: PropTypes.string,
  tableColumns: PropTypes.arrayOf(PropTypes.shape({
    dataIndex: PropTypes.string,
    defaultSortOrder: PropTypes.string,
    isNumeric: PropTypes.bool,
    render: PropTypes.func,
    sorter: PropTypes.func,
    title: PropTypes.string
  })).isRequired,
  tableRows: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.string
};

BaseTable.defaultProps = {
  defaultOrder: "asc",
  defaultOrderBy: null,
  enableFilter: false,
  padding: "default",
  rowKey: null,
  tableClassName: "",
  tableRows: [],
  title: ""
};

export default withStyles(styles)(BaseTable);
