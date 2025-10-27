import os.path
import sys

def main(targets: list[str]):
    source = sys.stdin.read()

    for target in targets:
        _write_if_changed(source, target)

def _write_if_changed(source: str, target: str):
    is_changed = True
    if os.path.exists(target):
        with open(target) as f:
            is_changed = f.read() != source
    else:
        target_dir = os.path.dirname(target)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

    if is_changed:
        with open(target, 'w') as f:
            f.write(source)

if __name__ == '__main__':
    main(sys.argv[1:])