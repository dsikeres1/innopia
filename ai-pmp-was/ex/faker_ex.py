from typing import Callable, TypeVar

from faker import Faker

T = TypeVar('T')

def faker_unique(gen: Callable[[], T], jar: set[T]) -> T:
    while True:
        value = gen()
        if value in jar:
            continue
        jar.add(value)
        return value

def faker_call(faker: Faker, call: Callable[[], T], number: int) -> list[T]:
    return [call() for _ in range(faker.randomize_nb_elements(number))]