import { Button, Col, Row } from "react-bootstrap";
import moment, { Moment } from "moment";
import { Calendar, DateRange, Range, RangeKeyDict } from "react-date-range";
import { isEqual, isNil } from "lodash";
import { NullableView } from "./nullable";
import {
  betweenFormatIsoDateTimeToString,
  betweenFormatIsoDateToString,
  formatIsoDate,
} from "../momentEx";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

export const DateRangePickerView = observer(
  (props: {
    startDate: Moment | null;
    endDate: Moment | null;
    onChange: (startDate: Moment | null, endDate: Moment | null) => void;
    placeholder?: string;
    isDisabled?: boolean;
    isInvalid?: boolean;
    className?: string;
    isShowTime?: boolean;
  }) => {
    const [model] = useState(
      () => new DateRangePickerModel(props.startDate, props.endDate)
    );

    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      model.init(props.startDate, props.endDate);

      function handleClickOutside(event: MouseEvent) {
        if (
          pickerRef.current &&
          !pickerRef.current.contains(event.target as HTMLDivElement)
        ) {
          model.onCancel(props.startDate, props.endDate);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [props.startDate, props.endDate, model]);

    const printValue =
      !isNil(model.value.startDate) && !isNil(model.value.endDate)
        ? props.isShowTime
          ? betweenFormatIsoDateTimeToString(
              moment(model.value.startDate),
              moment(model.value.endDate)
            )
          : betweenFormatIsoDateToString(
              moment(model.value.startDate),
              moment(model.value.endDate)
            )
        : props.placeholder ?? "";
    return (
      <div ref={pickerRef} className={props.className}>
        <div style={{ position: "relative" }}>
          <Button
            variant={props.isInvalid ? "outline-danger" : "outline-light"}
            style={{ color: "#6c757d" }}
            className={classNames(
              "form-control text-start form-control-button",
              { "is-invalid-custom": props.isInvalid ?? false }
            )}
            disabled={props.isDisabled}
            onClick={(_) => model.onClick(props.startDate, props.endDate)}
          >
            <i className={"mdi mdi-calendar me-1"} /> {printValue}
          </Button>
        </div>
        <NullableView condition={model.isShow}>
          <div
            className="form-control-button"
            style={{
              position: "absolute",
              zIndex: "3",
            }}
          >
            <div style={{ backgroundColor: "#ffffff" }}>
              <DateRange
                onChange={(item) => model.onChange(item)}
                moveRangeOnFirstSelection={false}
                ranges={model.values}
                displayMode={"date"}
                months={2}
                direction="horizontal"
              />
              <Row className="pb-2 me-1 ms-1 justify-content-between">
                <Col md={"auto"} sm={"auto"} xs={"auto"}>
                  <Button
                    size={"sm"}
                    variant={"outline-danger"}
                    onClick={() => model.onClear(props.onChange)}
                  >
                    Clear
                  </Button>
                </Col>
                <Col md={"auto"} sm={"auto"} xs={"auto"}>
                  <Button
                    className={"me-2"}
                    size={"sm"}
                    variant={"outline-warning"}
                    onClick={() =>
                      model.onCancel(props.startDate, props.endDate)
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    size={"sm"}
                    variant={"outline-info"}
                    disabled={!model.isDone}
                    onClick={() => model.onSave(props.onChange)}
                  >
                    Apply
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </NullableView>
      </div>
    );
  }
);

class DateRangePickerModel {
  isShow = false;
  isDone = false;
  values: Range[] = [
    {
      key: "selection",
    },
  ];

  get value(): Range {
    const range = this.values[0];
    if (isNil(range)) {
      throw Error("DateRangePickerModel 의 첫번째 값이 없다.");
    }
    return range;
  }

  constructor(startDate: Moment | null, endDate: Moment | null) {
    this.value.startDate = startDate?.toDate();
    this.value.endDate = endDate?.toDate();
    makeAutoObservable(this);
  }

  init(startDate: Moment | null, endDate: Moment | null) {
    this.value.startDate = startDate?.toDate();
    this.value.endDate = endDate?.toDate();
  }

  readonly onClick = (startDate: Moment | null, endDate: Moment | null) => {
    this.isShow = !this.isShow;
    this.value.startDate = startDate?.toDate() ?? new Date();
    this.value.endDate = endDate?.toDate() ?? new Date();
  };

  readonly onChange = (item: RangeKeyDict) => {
    this.isDone = false;
    const selection = item.selection;
    if (isNil(selection)) {
      throw new Error("DateRangePickerModel 의 onChange.selection 값이 없다.");
    }
    this.value.startDate = selection.startDate;
    this.value.endDate = selection.endDate;

    if (
      !isNil(this.value) &&
      selection.startDate !== selection.endDate &&
      moment(selection.endDate) !== moment(this.value.endDate)
    ) {
      this.isDone = true;
    }
  };

  readonly onCancel = (startDate: Moment | null, endDate: Moment | null) => {
    this.value.startDate = startDate?.toDate() ?? undefined;
    this.value.endDate = endDate?.toDate() ?? undefined;
    this.isShow = false;
  };

  readonly onSave = (
    onChange: (startDate: Moment | null, endDate: Moment | null) => void
  ) => {
    onChange(
      moment(this.value.startDate),
      moment(this.value.endDate).set({ hour: 23, minute: 59, second: 59 })
    );
    this.isShow = false;
  };

  readonly onClear = (
    onChange: (startDate: Moment | null, endDate: Moment | null) => void
  ) => {
    this.value.startDate = undefined;
    this.value.endDate = undefined;
    onChange(null, null);
    this.isShow = false;
  };
}

export const DatePickerView = observer(
  (props: {
    date: Moment | null;
    onChange: (date: Moment | null) => void;
    placeholder?: string;
    isDisabled?: boolean;
    isInvalid?: boolean;
    className?: string;
  }) => {
    const [model] = useState(() => new DatePickerModel(props.date));

    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      model.init(props.date);

      function handleClickOutside(event: MouseEvent) {
        if (
          model.isShow &&
          pickerRef.current &&
          !pickerRef.current.contains(event.target as HTMLDivElement)
        ) {
          model.onCancel(props.date);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [props, model]);
    const printValue = !isNil(model.value)
      ? formatIsoDate(moment(model.value))
      : props.placeholder ?? "";

    return (
      <div ref={pickerRef} className={props.className}>
        <div style={{ position: "relative" }}>
          <Button
            variant={"outline-light"}
            style={{ color: "#6c757d" }}
            className={classNames(
              "form-control text-start form-control-button",
              { "is-invalid-custom": props.isInvalid ?? false }
            )}
            disabled={props.isDisabled}
            onClick={(_) => model.onClick(props.date)}
          >
            <i className={"mdi mdi-calendar me-1"} /> {printValue}
          </Button>
        </div>
        <NullableView condition={model.isShow}>
          <div
            className="form-control-button"
            style={{
              position: "absolute",
              zIndex: "3",
            }}
          >
            <div style={{ backgroundColor: "#ffffff" }}>
              <Calendar
                onChange={action((item) => (model.value = moment(item)))}
                date={model.value?.toDate()}
              />
              <Row className="pb-2 me-1 ms-1 justify-content-between">
                <Col md={"auto"} sm={"auto"} xs={"auto"}>
                  <Button
                    size={"sm"}
                    variant={"outline-danger"}
                    onClick={() => model.onClear(props.onChange)}
                  >
                    Clear
                  </Button>
                </Col>
                <Col md={"auto"} sm={"auto"} xs={"auto"}>
                  <Button
                    className={"me-2"}
                    size={"sm"}
                    variant={"outline-warning"}
                    onClick={() => model.onCancel(props.date)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size={"sm"}
                    variant={"outline-info"}
                    disabled={isEqual(model.value, props.date)}
                    onClick={() => model.onSave(props.onChange)}
                  >
                    Apply
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </NullableView>
      </div>
    );
  }
);

class DatePickerModel {
  isShow = false;
  value: Moment | null = null;

  constructor(date: Moment | null) {
    this.value = date;
    makeAutoObservable(this);
  }

  init(date: Moment | null) {
    this.value = date;
  }

  readonly onClick = (date: Moment | null) => {
    this.isShow = !this.isShow;
    this.value = date;
  };

  readonly onChange = (date: Moment) => {
    this.value = date;
  };

  readonly onCancel = (date: Moment | null) => {
    this.value = date ?? null;
    this.isShow = false;
  };

  readonly onSave = (onChange: (date: Moment | null) => void) => {
    onChange(this.value);
    this.isShow = false;
  };

  readonly onClear = (onChange: (date: Moment | null) => void) => {
    this.value = null;
    onChange(null);
    this.isShow = false;
  };
}