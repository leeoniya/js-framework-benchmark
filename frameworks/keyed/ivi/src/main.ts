import { defineRoot, dirtyCheck, update, component, List, eventDispatcher, getProps, useReducer, html } from "ivi";
import { Entry, State, Action, ActionType } from "./types.js";

const random = (max: number) => Math.round(Math.random() * 1000) % max;
const A = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const C = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const N = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

let nextId = 1;
function buildData(count: number): Entry[] {
  const data = Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = { id: nextId++, label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}` };
  }
  return data;
}

const getEntryId = (entry: Entry) => entry.id;

const INITIAL_STATE: State = { data: [], selected: 0 };

function appStateReducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.Run:
      return { ...state, data: buildData(1000) };
    case ActionType.RunLots:
      return { ...state, data: buildData(10000) };
    case ActionType.Add:
      return { ...state, data: [...state.data, ...buildData(1000)] };
    case ActionType.Update: {
      const data = state.data.slice();
      for (let i = 0; i < data.length; i += 10) {
        const r = data[i];
        data[i] = { id: r.id, label: r.label + " !!!" };
      }
      return { ...state, data };
    }
    case ActionType.SwapRows: {
      const data = state.data.slice();
      const tmp = data[1];
      data[1] = data[998];
      data[998] = tmp;
      return { ...state, data };
    }
    case ActionType.Select: {
      return { ...state, selected: action.entry.id };
    }
    case ActionType.Remove: {
      const data = state.data.slice();
      data.splice(data.indexOf(action.entry), 1);
      return { ...state, data };
    }
    case ActionType.Clear:
      return INITIAL_STATE;
  }
}

const dispatch = eventDispatcher<Action>("dispatch");

interface RowProps {
  readonly entry: Entry;
  readonly selected: boolean;
}

const Row = component<RowProps>((c) => {
  const onSelect = () => { dispatch(c, { type: ActionType.Select, entry: getProps(c).entry }); };
  const onRemove = () => { dispatch(c, { type: ActionType.Remove, entry: getProps(c).entry }); };

  return ({ entry, selected }) => html`
    <tr class=${selected === true ? "danger" : ""}>
      <td class="col-md-1" .textContent=${entry.id}/>
      <td class="col-md-4">
        <a @click=${onSelect} .textContent=${entry.label}/>
      </td>
      <td class="col-md-1">
        <a @click=${onRemove}>
          <span class="glyphicon glyphicon-remove" aria-hidden="true"/>
        </a>
      </td>
      <td class="col-md-6"/>
    </tr>
  `;
});

const Button = (text: string, id: string, onClick: () => void) => html`
  <div class="col-sm-6 smallpad">
    <button class="btn btn-primary btn-block" type="button" id=${id} @click=${onClick}>
      ${text}
    </button>
  </div>
`;

const App = component((c) => {
  const [_state, _dispatch] = useReducer(c, INITIAL_STATE, appStateReducer);

  const onDispatch = (ev: CustomEvent<Action>) => { _dispatch(ev.detail); };

  const buttons = [
    Button("Create 1,000 rows",     "run",      () => { _dispatch({ type: ActionType.Run      }); }),
    Button("Create 10,000 rows",    "runlots",  () => { _dispatch({ type: ActionType.RunLots  }); }),
    Button("Append 1,000 rows",     "add",      () => { _dispatch({ type: ActionType.Add      }); }),
    Button("Update every 10th row", "update",   () => { _dispatch({ type: ActionType.Update   }); }),
    Button("Clear",                 "clear",    () => { _dispatch({ type: ActionType.Clear    }); }),
    Button("Swap Rows",             "swaprows", () => { _dispatch({ type: ActionType.SwapRows }); }),
  ];

  return () => {
    const { data, selected } = _state();

    return html`
      <div class="container">
        <div class="jumbotron">
          <div class="row">
            <div class="col-md-6">
              <h1>ivi</h1>
            </div>
            <div class="col-md-6">
              <div class="row">
                ${buttons}
              </div>
            </div>
          </div>
        </div>
        <table class="table table-hover table-striped test-data" @dispatch=${onDispatch}>
          <tbody>
            ${List(data, getEntryId, (entry) => Row({ entry, selected: selected === entry.id }))}
          </tbody>
        </table>
        <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"/>
      </div>
    `;
  };
});

update(
  // Defines a custom root node that disables batching for benchmark.
  defineRoot((root) => { dirtyCheck(root); })(document.getElementById("main")!),
  App()
);
