import { observer } from "mobx-react-lite";
import { FormCheck, FormControl } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import moment, { Moment } from "moment";
import { action, makeAutoObservable } from "mobx";
import { isNil, padStart } from "lodash";
import classNames from "classnames";
import { NullableView } from "./nullable";
import { formatIsoTime, fromIsoFormatTime } from "../momentEx";

const TimePicker = observer(
  (props: {
    use12Hours: boolean;
    onChange: (time: Moment | undefined) => void;
    value: Moment | null;
  }) => {
    const [model] = useState(() => new TimePickerModel());

    useEffect(() => {
      model.init(props.value, props.use12Hours, props.onChange);
    }, [model, props]);

    return (
      <div
        style={{
          width: `${props.use12Hours ? "167px" : "111px"}`,
          display: "flex",
        }}
      >
        <NullableView condition={model.use12Hours}>
          <div className={"time-picker-wrapper"}>
            {model.amPm.map((item, index) => (
              <div
                key={`timepicker-hour-${item.label}-${index}`}
                className={"text-center"}
              >
                <FormCheck
                  type={"radio"}
                  label={item.label}
                  value={item.value}
                  id={`time-picker-ampm-${item.label}`}
                  name={`time-picker-ampm`}
                  className={"form-check-inline time-picker-radio-inline"}
                  checked={model.selectedAmPm === item.value}
                  onChange={action((_) => model.updateSelectAmPm(item.value))}
                />
              </div>
            ))}
          </div>
        </NullableView>
        <div className={"time-picker-wrapper"}>
          {model.hours.map((hour, index) => (
            <div
              key={`timepicker-hour-${hour.label}-${index}`}
              className={"text-center"}
            >
              <FormCheck
                type={"radio"}
                label={hour.label}
                value={hour.value}
                id={`time-picker-hour-${hour.label}`}
                name={`time-picker-hour`}
                className={"form-check-inline time-picker-radio-inline"}
                checked={model.selectedHour === hour.value}
                onChange={action((_) => model.updateSelectedHour(hour.value))}
              />
            </div>
          ))}
        </div>
        <div className={"time-picker-wrapper"}>
          {model.minutes.map((minute, index) => (
            <div
              key={`timepicker-minute-${minute.label}-${index}`}
              className={"text-center"}
            >
              <FormCheck
                type={"radio"}
                label={minute.label}
                value={minute.value}
                id={`time-picker-minute-${minute.label}`}
                name={`time-picker-minute`}
                className={"form-check-inline time-picker-radio-inline"}
                checked={model.selectedMinute === minute.value}
                onChange={action((_) =>
                  model.updateSelectedMinute(minute.value)
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

class TimePickerModel {
  use12Hours: boolean = false;
  value: Moment | null = null;
  amPm = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];
  hours: { value: number; label: string }[] = [];
  minutes: { value: number; label: string }[] = [];

  selectedAmPm: string | null = null;
  selectedHour: number | null = null;
  selectedMinute: number | null = null;

  onChangeProps: ((time: Moment | undefined) => void) | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  init(
    value: Moment | null,
    use12Hours: boolean,
    onChange: (time: Moment | undefined) => void
  ) {
    this.value = value;
    this.use12Hours = use12Hours;
    this.hours = [];
    for (let i = 0; i < (this.use12Hours ? 12 : 24); i++) {
      this.hours.push({ value: i, label: padStart(i.toString(), 2, "0") });
    }
    this.minutes = [];
    for (let i = 0; i < 6; i++) {
      this.minutes.push({
        value: i * 10,
        label: padStart((i * 10).toString(), 2, "0"),
      });
    }
    this.onChangeProps = onChange;
  }

  updateSelectAmPm(value: string | null) {
    this.selectedAmPm = value;

    this.onChange();
  }

  updateSelectedHour(value: number | null) {
    this.selectedHour = value;
    this.onChange();
  }

  updateSelectedMinute(value: number | null) {
    this.selectedMinute = value;
    this.onChange();
  }

  readonly onChange = () => {
    if (isNil(this.selectedHour) || isNil(this.selectedMinute)) {
      return;
    }

    if (this.use12Hours && isNil(this.selectedAmPm)) {
      return;
    }

    const hour =
      this.selectedHour +
      (!isNil(this.selectedAmPm) && this.selectedAmPm == "PM" ? 12 : 0);
    if (!isNil(this.onChangeProps)) {
      this.onChangeProps(fromIsoFormatTime(`${hour}:${this.selectedMinute}`));
    }
  };
}

export const TimePickerView = observer(
  (props: {
    value: Moment | null;
    onChange: (time: Moment | null) => void;
    placeholder?: string;
    use12Hours?: boolean;
    showSecond?: boolean; 
    isInvalid?: boolean;
    isDisabled?: boolean;
  }) => {
    const [model] = useState(() => new TimePickerViewModel());
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      model.init(props.value);

      function handleClickOutside(event: MouseEvent) {
        if (
          pickerRef.current &&
          !pickerRef.current.contains(event.target as HTMLDivElement)
        ) {
          model.onCancel(props.value);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [props, model]);

    const printValue = !isNil(model.value)
      ? formatIsoTime(moment(model.value))
      : props.placeholder ?? "";

    return (
      <div
        ref={pickerRef}
        className={classNames({
          "is-invalid": !!props.isInvalid,
        })}
      >
        <span className="time-picker-input">
          <i
            className="time-picker-input-icon mdi mdi-clock-outline"
            onClick={() => {
              if (props.isDisabled !== true) {
                model.onClick(props.value);
              }
            }}
          />
          <FormControl
            type="text"
            value={printValue}
            disabled={props.isDisabled}
            onChange={() => {}}
            onClick={() => model.onClick(props.value)}
            className={classNames({
              "is-invalid-custom-border": props.isInvalid,
            })}
            isInvalid={props.isInvalid}
          />
          <NullableView condition={!props.isDisabled}>
            <i
              className="time-picker-input-clear mdi mdi-close"
              style={{
                display:
                  printValue == (props.placeholder || "") ? "none" : "block",
              }}
              onClick={(_) => model.onClear(props.onChange)}
            />
          </NullableView>
        </span>

        <NullableView condition={model.isShow}>
          <div
            className="time-select-wrap"
            style={{
              position: "absolute",
              zIndex: "3",
              backgroundColor: "#fff",
              color: "#6c757d",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
              }}
            >
              <TimePicker
                value={model.value}
                use12Hours={props.use12Hours ?? false}
                onChange={action((time) => {
                  if (!isNil(time)) {
                    model.value = time;
                    model.onSave(props.onChange);
                  }
                })}
              />
            </div>
          </div>
        </NullableView>

      </div>
    );
  }
);

export default TimePickerView;

class TimePickerViewModel {
  isShow = false;
  value: Moment | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  init(value: Moment | null) {
    this.value = value;
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