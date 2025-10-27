import { observer } from "mobx-react-lite";
import { action, makeAutoObservable } from "mobx";
import { Button, Col, Row } from "react-bootstrap";
import classNames from "classnames";
import { NullableView } from "./nullable";
import { Calendar } from "react-date-range";
import React, { useEffect, useRef, useState } from "react";
import { isEqual, isNil } from "lodash";
import { formatIsoDateTime } from "../momentEx";
import moment, { Moment } from "moment/moment";
import TimePicker from "./timePicker";
import { isNotNil } from "../lodashEx";

const DateTimePickerView = observer(
  (props: {
    date: Moment | null;
    onChange: (date: Moment | null) => void;
    placeholder?: string;
    isDisabled?: boolean;
    isInvalid?: boolean;
    className?: string;
    use12Hours?: boolean;
  }) => {
    const model = useState(() => new DateTimePickerModel(props.date))[0];

    const pickerRef = useRef<HTMLDivElement>(null);

    const printValue = !isNil(model.value)
      ? formatIsoDateTime(moment(model.value))
      : props.placeholder ?? "";

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          model.isShow &&
          pickerRef.current &&
          !pickerRef.current.contains(event.target as HTMLDivElement)
        ) {
          model.onCancel(props.date);
        }
      }

      if (isNil(props.date)) {
        model.init(null);
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [props, model]);

    const propsDate = props.date;
    useEffect(() => {
      if (isNotNil(propsDate)) {
      model.init(propsDate);
      }
    }, [propsDate]);

    return (
      <div ref={pickerRef} className={props.className}>
        <div style={{ position: "relative" }}>
          <Button
            variant="outline-light"
            style={{
              color: "#6c757d",
              borderColor: props.isInvalid ? "#fa5c7c" : "#dee2e6",
            }}
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
              border: "1px solid #eee",
            }}
          >
            <div style={{ backgroundColor: "#ffffff" }}>
              <Calendar
                onChange={action((item) => {
                  model.hasDate = false;
                  model.value = moment(item);
                })}
                date={model.value?.toDate()}
              />
              <div className="bg-white px-2 mb-2">
                <TimePicker
                  value={model.value}
                  use12Hours={props.use12Hours ?? false}
                  onChange={action((time) => {
                    if (isNil(model.value)) {
                      model.hasDate = true;
                      return;
                    }

                    if (!isNil(time)) {
                      model.hasDate = false;
                      model.value =
                        model.value
                          ?.hours(time.hour())
                          .minutes(time.minute()) ?? null;
                    }
                  })}
                />
                {model.hasDate && (
                  <>
                    <i className="mdi mdi-star text-danger align-middle font-10" />
                    <span className="font-11 text-danger">
                      날짜 먼저 선택해주세요.
                    </span>
                  </>
                )}
              </div>
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

class DateTimePickerModel {
  isShow = false;
  value: Moment | null = null;

  hasDate = false;

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

export default DateTimePickerView;