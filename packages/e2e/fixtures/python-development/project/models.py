class Invoice:
    def __init__(self, amounts: list[int]) -> None:
        self.amounts = amounts

    def total(self) -> int:
        return sum(self.amounts)
