import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./data-table.module.css";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

export type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  empty?: ReactNode;
  caption?: string;
};

export function DataTable<T>({ columns, rows, getRowKey, empty, caption }: DataTableProps<T>) {
  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={styles.thead}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(column.align === "right" && styles.right, column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={columns.length}>
                  {empty ?? "Belum ada data."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowKey(row)} className={styles.row}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.header}
                      className={cn(column.align === "right" && styles.right, column.className)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
