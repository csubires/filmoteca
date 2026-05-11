"""
# Filename: database.py
# Version: 2.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/01/20 11:57:38 by CSUBIRES
# Updated: 2024/11/26 10:30:00 by CSUBIRES
# Description: Enhanced SQLite database handler with Python 3.12+ features
"""

import sqlite3
import threading
import contextlib
from typing import Optional, List, Tuple, Dict, Any, Union
from pathlib import Path


class Logging:
    """Simple logger for testing - replace with your actual logger"""

    def __init__(self, logfile):
        self.logfile = logfile

    def object(self, msg, *args):
        print(f"[INFO] {msg}: {args if args else ''}")

    def error(self, method, msg, error=None):
        print(f"[ERROR] {method}: {msg} - {error if error else ''}")


def singleton(cls):
    """Simple singleton decorator"""
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


# @singleton
class Handler_SQL:
    """Enhanced SQLite database handler with thread safety and context management

    Args:
        database (str): Database file path or ':memory:'
        tag_query (dict): Dictionary mapping tags to SQL queries
        timeout (float): Connection timeout in seconds (default: 5.0)
        detect_types (int): SQLite type detection flag (default: 0)
        isolation_level (str): Transaction isolation level (default: None)
        row_factory (str or callable): 'dict' for sqlite3.Row or custom factory
        autocommit (bool): Enable autocommit mode (Python 3.12+, default: False)
    """

    def __init__(
        self,
        database: str,
        tag_query: Dict[str, str],
        timeout: float = 5.0,
        detect_types: int = 0,
        isolation_level: Optional[str] = None,
        row_factory: Optional[Union[str, callable]] = None,
        autocommit: bool = False,
    ):
        self.database = database
        self.tag_query = tag_query
        self.db: Optional[sqlite3.Connection] = None
        self.cdb: Optional[sqlite3.Cursor] = None
        self.logger = Logging("logs/database.log")
        self.lock = threading.RLock()
        self.timeout = timeout
        self.detect_types = detect_types
        self.isolation_level = isolation_level
        self.autocommit = autocommit

        # Validate database path for file-based databases
        if database != ":memory:":
            Path(database).parent.mkdir(parents=True, exist_ok=True)

        # Establish connection
        self._connect(row_factory)

    def _connect(self, row_factory: Optional[Union[str, callable]] = None):
        """Establish database connection"""
        try:
            # Python 3.12+ autocommit support
            if (
                self.autocommit
                and hasattr(sqlite3, "connect")
                and "autocommit" in sqlite3.connect.__code__.co_varnames
            ):
                self.db = sqlite3.connect(
                    self.database,
                    timeout=self.timeout,
                    detect_types=self.detect_types,
                    isolation_level=self.isolation_level,
                    autocommit=self.autocommit,
                    check_same_thread=False,
                )
            else:
                self.db = sqlite3.connect(
                    self.database,
                    timeout=self.timeout,
                    detect_types=self.detect_types,
                    isolation_level=self.isolation_level,
                    check_same_thread=False,
                )

            # Configure row factory
            if row_factory == "dict":
                self.db.row_factory = sqlite3.Row
            elif callable(row_factory):
                self.db.row_factory = row_factory

            # Enable foreign key constraints
            self.db.execute("PRAGMA foreign_keys = ON")

            # Enable WAL mode for better concurrency (skip for :memory:)
            if self.database != ":memory:":
                try:
                    self.db.execute("PRAGMA journal_mode = WAL")
                except sqlite3.Error:
                    pass  # Ignore if WAL not supported

            self.cdb = self.db.cursor()
            self.logger.object("Connected to database", self.database)

        except sqlite3.Error as e:
            self.logger.error("Connecting to the database", self.database, e)
            self.db = None
            self.cdb = None
            raise ConnectionError(f"Failed to connect to database: {e}")

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with automatic rollback on error"""
        if exc_type and self.db:
            self.rollback()
        self.close()
        return False

    def __del__(self):
        """Destructor with safe cleanup"""
        self.close()

    def close(self):
        """Safely close database connection"""
        if self.db:
            try:
                self.db.close()
                self.logger.object(f'Database "{self.database}" closed')
            except sqlite3.Error as e:
                self.logger.error("Closing database connection", self.database, e)
            finally:
                self.db = None
                self.cdb = None

    def execute(
        self, tag: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[List[tuple]]:
        """Execute SQL statement with parameterized query"""
        if not self.cdb:
            raise sqlite3.Error("Database cursor is not available")

        if tag not in self.tag_query:
            error_msg = f"Query tag '{tag}' not found in tag_query dictionary"
            self.logger.error("execute()", error_msg)
            raise KeyError(error_msg)

        params = params or {}
        sentence = self.tag_query[tag]
        response = None

        try:
            with self.lock:
                self.cdb.execute(sentence, params)

                if sentence.strip().upper().startswith("SELECT"):
                    result = self.cdb.fetchall()
                    response = result if result else None
                else:
                    self.db.commit()
                    response = None

        except sqlite3.Error as e:
            self.logger.error(
                f"{type(self).__name__}.execute()",
                f"Tag: {tag}, Query: {sentence}, Params: {params}\n{e}",
            )
            self.rollback()
            raise

        return response

    def execute_many(self, tag: str, params: List[tuple]) -> None:
        """Execute batch operations (INSERT, UPDATE, DELETE) efficiently"""
        if not self.cdb:
            raise sqlite3.Error("Database cursor is not available")

        if tag not in self.tag_query:
            error_msg = f"Query tag '{tag}' not found in tag_query dictionary"
            self.logger.error("execute_many()", error_msg)
            raise KeyError(error_msg)

        sentence = self.tag_query[tag]

        try:
            with self.lock:
                self.cdb.executemany(sentence, params)
                self.db.commit()

        except sqlite3.Error as e:
            self.logger.error(
                f"{type(self).__name__}.execute_many()",
                f"Tag: {tag}, Query: {sentence}, Params count: {len(params)}\n{e}",
            )
            self.rollback()
            raise

    def execute_script(self, sql_script: str) -> None:
        """Execute multiple SQL statements from a script"""
        if not self.cdb:
            raise sqlite3.Error("Database cursor is not available")

        try:
            with self.lock:
                self.cdb.executescript(sql_script)
                self.db.commit()
        except sqlite3.Error as e:
            self.logger.error(f"{type(self).__name__}.execute_script()", str(e))
            self.rollback()
            raise

    def execute_raw(
        self, sql: str, params: Optional[Union[tuple, dict]] = None
    ) -> List[tuple]:
        """Execute raw SQL without tag lookup (for advanced operations)"""
        if not self.cdb:
            raise sqlite3.Error("Database cursor is not available")

        try:
            with self.lock:
                if params:
                    self.cdb.execute(sql, params)
                else:
                    self.cdb.execute(sql)

                if sql.strip().upper().startswith("SELECT"):
                    result = self.cdb.fetchall()
                    return result if result else []
                else:
                    self.db.commit()
                    return []

        except sqlite3.Error as e:
            self.logger.error(
                f"{type(self).__name__}.execute_raw()", f"SQL: {sql[:200]}...\n{e}"
            )
            self.rollback()
            raise

    def lastid(self) -> Optional[int]:
        """Return the last inserted row ID (primary key)"""
        return self.cdb.lastrowid if self.cdb else None

    def affected(self) -> int:
        """Return number of rows affected by last INSERT, UPDATE, or DELETE"""
        return self.cdb.rowcount if self.cdb else -1

    @contextlib.contextmanager
    def transaction(self):
        """Context manager for explicit transaction control"""
        try:
            self.begin()
            yield
            self.commit()
        except Exception as e:
            self.rollback()
            self.logger.error("Transaction failed", str(e))
            raise

    def begin(self):
        """Explicitly begin a transaction"""
        self.execute_raw("BEGIN TRANSACTION")

    def commit(self):
        """Commit the current transaction"""
        if self.db:
            self.db.commit()

    def rollback(self):
        """Rollback the current transaction"""
        if self.db:
            try:
                self.db.rollback()
            except sqlite3.Error as e:
                self.logger.error("rollback()", "Rollback failed", e)

    def backup(self, target_db: str, pages: int = -1) -> None:
        """Create backup of current database"""
        if not self.db:
            raise sqlite3.Error("No active database connection")

        target_conn = None
        try:
            target_conn = sqlite3.connect(target_db)
            with target_conn:
                self.db.backup(target_conn, pages=pages)
            self.logger.object(f"Database backed up to {target_db}")
        except (sqlite3.Error, AttributeError) as e:
            self.logger.error(f"{type(self).__name__}.backup()", str(e))
            raise
        finally:
            if target_conn:
                target_conn.close()

    def integrity_check(self) -> List[str]:
        """Run PRAGMA integrity_check"""
        try:
            result = self.execute_raw("PRAGMA integrity_check")
            if result and result[0][0] == "ok":
                return []
            return [row[0] for row in (result or [])]
        except sqlite3.Error as e:
            self.logger.error("Integrity check failed", str(e))
            raise

    def vacuum(self) -> None:
        """Rebuild database to optimize size and performance"""
        self.execute_raw("VACUUM")
        self.logger.object("Database vacuum completed")

    def pragma(self, command: str) -> List[tuple]:
        """Execute PRAGMA statement"""
        return self.execute_raw(f"PRAGMA {command}")

    def get_table_info(self, table_name: str) -> List[Dict]:
        """Get table schema information"""
        result = self.execute_raw(f"PRAGMA table_info({table_name})")
        if not result:
            return []

        columns = ["cid", "name", "type", "notnull", "dflt_value", "pk"]
        return [dict(zip(columns, row)) for row in result]

    def iterdump(self) -> str:
        """Generate SQL dump of database content"""
        if not self.db:
            return ""

        dump = "\n".join(self.db.iterdump())
        return dump

    def enable_foreign_keys(self, enable: bool = True) -> None:
        """Enable or disable foreign key constraints"""
        self.execute_raw(f"PRAGMA foreign_keys = {1 if enable else 0}")

    def set_journal_mode(self, mode: str = "WAL") -> None:
        """Set journal mode for better performance"""
        valid_modes = {"DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"}
        if mode.upper() not in valid_modes:
            raise ValueError(f"Invalid journal mode. Choose from: {valid_modes}")

        result = self.execute_raw(f"PRAGMA journal_mode = {mode.upper()}")
        self.logger.object(f"Journal mode set to {result[0][0] if result else mode}")

    def total_changes(self) -> int:
        """Return total number of database rows changed since connection"""
        return self.db.total_changes() if self.db else 0
