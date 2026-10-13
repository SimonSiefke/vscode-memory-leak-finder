import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("summary", Path(__file__).with_name("summarize.py"))
summary = importlib.util.module_from_spec(spec)
spec.loader.exec_module(summary)


class SummaryTests(unittest.TestCase):
    def test_compares_within_runners_instead_of_weighting_by_host_speed(self):
        runs = []
        for scale, effect in [(100, 0.9), (10000, 1.1)]:
            values = {"timing": {"before": [scale, scale], "after": [scale * effect, scale * effect]}}
            runs.append({"values": values, "blocks": {"timing": {v: dict(enumerate(a)) for v, a in values["timing"].items()}}})
        result = summary.compare(runs, "timing", "before", "after")
        self.assertAlmostEqual(result["percentChangeOfMeans"], 0)
        self.assertAlmostEqual(result["perRunnerMeanChanges"][0], -10)
        self.assertAlmostEqual(result["perRunnerMeanChanges"][1], 10)
        self.assertLess(result["meanChange95CI"][0], 0)
        self.assertGreater(result["meanChange95CI"][1], 0)

    def test_missing_samples_and_absent_runners_are_incomplete(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "environment.json").write_text(json.dumps({"startupSamples": 3, "replica": 1}))
            (root / "perf-capability.json").write_text(json.dumps({"available": False}))
            self.assertFalse(summary.load(root)["complete"])
            with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
                summary.summarize(root, require_complete=True)
            with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
                summary.summarize(root, aggregate=True, require_complete=True)

    def test_rejects_measurements_from_another_revision(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            evidence = root / "startup"
            evidence.mkdir()
            (evidence / "after-0000.json").write_text(json.dumps({"warmup": False, "sha": "wrong", "index": 0, "mainToTimerReady": 100}))
            with self.assertRaisesRegex(RuntimeError, "revision mismatch"):
                summary.load(root)

    def test_startup_metadata_is_not_a_measurement(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            evidence = root / "startup"
            evidence.mkdir()
            (evidence / "after-timer-source.json").write_text(json.dumps({"sha": summary.COMMITS["after"]}))
            sample = {"warmup": False, "sha": summary.COMMITS["after"], "index": 0, "mainToTimerReady": 123, "elapsed": 100}
            (evidence / "after-0000.json").write_text(json.dumps(sample))
            (evidence / "after-00-1.json").write_text(json.dumps(dict(sample, warmup=True, index=-1)))
            run = summary.load(root)
            self.assertEqual(run["values"]["mainToTimerReady"]["after"], [123])
            self.assertEqual(run["blocks"]["elapsed"]["after"], {0: 100})


if __name__ == "__main__":
    unittest.main()
