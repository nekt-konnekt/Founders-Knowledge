#!/usr/bin/env python3
"""Synthetic recovery drill for the Founders Knowledge recovery lesson.
Local teaching harness only: standard library, synthetic data, temporary files,
no network calls, no environment variables and no real credentials.
"""
from __future__ import annotations
import hashlib, json, shutil, sqlite3, tempfile, time
from pathlib import Path

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()

def apply_provider_event(connection: sqlite3.Connection, provider: dict) -> None:
    """Apply one provider event atomically; replaying the same event is safe."""
    connection.execute("BEGIN IMMEDIATE")
    try:
        connection.execute(
          """INSERT INTO payments (provider_reference,order_id,amount_kobo,status,event_id)
             VALUES (?,?,?,?,?) ON CONFLICT(provider_reference) DO NOTHING""",
          (provider["provider_reference"],provider["order_id"],provider["amount_kobo"],provider["status"],provider["event_id"])
        )
        connection.execute(
          "UPDATE orders SET status='paid',updated_at=? WHERE id=? AND status='pending'",
          (provider["occurred_at"],provider["order_id"])
        )
        connection.execute(
          """INSERT INTO outbox (event_id,order_id,event_type,processed) VALUES (?,?,?,0)
             ON CONFLICT(event_id) DO NOTHING""",
          (provider["event_id"],provider["order_id"],"order.paid")
        )
        connection.commit()
    except Exception:
        connection.rollback()
        raise

def run_drill() -> dict:
    with tempfile.TemporaryDirectory(prefix="fk-recovery-drill-") as tmp:
        root = Path(tmp)
        live, backup, recovered = (root / name for name in ("live", "backup", "recovered"))
        for directory in (live, backup, recovered):
            directory.mkdir()
        receipt = live / "receipt-ORD-100.txt"
        receipt.write_text("Synthetic receipt\norder=ORD-100\namount_kobo=2500000\n", encoding="utf-8")
        shutil.copy2(receipt, backup / receipt.name)
        expected_hash = sha256(receipt)
        live_db = live / "app.sqlite"
        connection = sqlite3.connect(live_db)
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript("""
        CREATE TABLE users (id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('customer','support','admin')));
        CREATE TABLE orders (
          id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES users(id),
          amount_kobo INTEGER NOT NULL CHECK(amount_kobo > 0), currency TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('pending','paid','fulfilled')), updated_at TEXT NOT NULL
        );
        CREATE TABLE payments (
          provider_reference TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
          amount_kobo INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('success','failed','reversed')),
          event_id TEXT UNIQUE NOT NULL
        );
        CREATE TABLE outbox (event_id TEXT PRIMARY KEY, order_id TEXT NOT NULL, event_type TEXT NOT NULL, processed INTEGER NOT NULL DEFAULT 0);
        """)
        connection.execute("INSERT INTO users (id, role) VALUES (?, ?)", ("USR-TEST-1", "customer"))
        connection.execute(
          "INSERT INTO orders (id,customer_id,amount_kobo,currency,status,updated_at) VALUES (?,?,?,?,?,?)",
          ("ORD-100","USR-TEST-1",2500000,"NGN","pending","2026-11-26T09:00:00Z")
        )
        connection.commit()
        backup_db = backup / "app.sqlite"
        backup_connection = sqlite3.connect(backup_db)
        connection.backup(backup_connection)
        backup_connection.close()
        provider = {
          "provider_reference":"PAY-REF-100","order_id":"ORD-100","amount_kobo":2500000,
          "status":"success","event_id":"evt-test-100","occurred_at":"2026-11-26T09:03:00Z"
        }
        connection.execute("DELETE FROM orders WHERE id=?", ("ORD-100",))
        connection.commit()
        connection.close()
        started = time.monotonic()
        recovered_db = recovered / "app.sqlite"
        shutil.copy2(backup_db, recovered_db)
        recovered_receipt = recovered / receipt.name
        shutil.copy2(backup / receipt.name, recovered_receipt)
        restored = sqlite3.connect(recovered_db)
        restored.execute("PRAGMA foreign_keys = ON")
        integrity = restored.execute("PRAGMA integrity_check").fetchone()[0]
        assert integrity == "ok"
        order = restored.execute(
          "SELECT id,customer_id,amount_kobo,currency,status FROM orders WHERE id=?",
          ("ORD-100",)
        ).fetchone()
        assert order == ("ORD-100","USR-TEST-1",2500000,"NGN","pending")
        role = restored.execute("SELECT role FROM users WHERE id=?", ("USR-TEST-1",)).fetchone()
        assert role == ("customer",)
        assert sha256(recovered_receipt) == expected_hash

        # Reconcile once, then replay the entire event transaction.
        apply_provider_event(restored, provider)
        apply_provider_event(restored, provider)

        payment_count = restored.execute("SELECT COUNT(*) FROM payments WHERE provider_reference=?", (provider["provider_reference"],)).fetchone()[0]
        outbox_count = restored.execute("SELECT COUNT(*) FROM outbox WHERE event_id=?", (provider["event_id"],)).fetchone()[0]
        workflow = restored.execute(
          """SELECT orders.status,payments.status,users.role FROM orders
             JOIN payments ON payments.order_id=orders.id JOIN users ON users.id=orders.customer_id
             WHERE orders.id=?""", ("ORD-100",)
        ).fetchone()
        foreign_key_violations = restored.execute("PRAGMA foreign_key_check").fetchall()
        restored.close()
        assert payment_count == 1 and outbox_count == 1
        assert workflow == ("paid","success","customer")
        assert not foreign_key_violations
        return {
          "result":"PASS",
          "scope":"synthetic local SQLite reference drill; not a production or provider restore",
          "checks":{
            "restore_to_separate_target":"PASS","database_integrity":integrity,"foreign_key_integrity":"PASS",
            "synthetic_customer_and_order":"PASS","separate_file_object_hash":"PASS",
            "simulated_external_payment_reconciliation":"PASS","full_event_replay_idempotency":"PASS",
            "synthetic_order_payment_state":"PASS","outbound_effects":"blocked; outbox remains queued"
          },
          "illustrative_recovery_point":{
            "backup_time":"2026-11-26T09:00:00Z","external_payment_time":provider["occurred_at"],
            "gap_minutes":3,"note":"synthetic data only; not a production RPO measurement"
          },
          "local_restore_to_state_check_seconds":round(time.monotonic()-started,6),
          "timing_note":"local harness timing only; not a service RTO"
        }

if __name__ == "__main__":
    print(json.dumps(run_drill(), indent=2))
