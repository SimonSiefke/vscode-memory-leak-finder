import json
import os
import sys
import unittest
from pathlib import Path

from project.models import Invoice


Path(sys.prefix).parent.joinpath('.python-discovered.json').write_text(
    json.dumps({'pid': os.getpid(), 'prefix': sys.prefix}), encoding='utf8'
)


class InvoiceTests(unittest.TestCase):
    def test_invoice_total(self) -> None:
        total = Invoice([10, 12, 20]).total()
        self.assertEqual(total, 42)
        Path(sys.prefix).parent.joinpath('.python-run.json').write_text(
            json.dumps({'total': total, 'prefix': sys.prefix}), encoding='utf8'
        )
