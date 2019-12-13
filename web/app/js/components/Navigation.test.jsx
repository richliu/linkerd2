import ApiHelpers from './util/ApiHelpers.jsx';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Navigation from './Navigation.jsx';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import { mount } from 'enzyme';

sinonStubPromise(sinon);

const loc = {
  pathname: '',
  hash: '',
  pathPrefix: '',
  search: '',
};

const namespaces = [
  {key: "-namespace-default", name: "default", namespace: "", type: "namespace"},
  {key: "-namespace-emojivoto", name: "emojivoto", namespace: "", type: "namespace"},
  {key: "-namespace-linkerd", name: "linkerd", namespace: "", type: "namespace"},
];

describe('Navigation', () => {
  let curVer = "edge-1.2.3";
  let newVer = "edge-2.3.4";
  let selectedNamespace = "emojivoto"

  let component, fetchStub;
  let apiHelpers = ApiHelpers("");
  const childComponent = () => null;

  function withPromise(fn) {
    return component.find("NavigationBase").instance().versionPromise.then(fn);
  }

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    component = null;
    window.fetch.restore();
  });

  it('renders up to date message when versions match', () => {
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve({ edge: curVer })
    });

    component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={childComponent}
          classes={{}}
          theme={{}}
          location={loc}
          api={apiHelpers}
          releaseVersion={curVer}
          selectedNamespace={selectedNamespace}
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    return withPromise(() => {
      expect(component).toIncludeText("Linkerd is up to date");
    });
  });

  it('renders update message when versions do not match', () => {
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve({ edge: newVer })
    });

    component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={childComponent}
          classes={{}}
          theme={{}}
          location={loc}
          api={apiHelpers}
          releaseVersion={curVer}
          selectedNamespace={selectedNamespace}
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    return withPromise(() => {
      expect(component).toIncludeText("A new version (2.3.4) is available.");
    });
  });

  it('renders error when version check fails', () => {
    let errMsg = "Fake error";

    fetchStub.rejects({
      ok: false,
      json: () => Promise.resolve({
        error: {},
      }),
      statusText: errMsg,
    });

    component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={childComponent}
          classes={{}}
          theme={{}}
          location={loc}
          api={apiHelpers}
          releaseVersion={curVer}
          selectedNamespace={selectedNamespace}
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    return withPromise(() => {
      expect(component).toIncludeText("Version check failed: Fake error.");
      expect(component).toIncludeText(errMsg);
    });
  });
});

describe('Namespace Select Button', () => {
  it('displays All Namespaces as button text if the selected namespace is _all', () => {
    const component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={() => null}
          classes={{}}
          theme={{}}
          location={loc}
          api={ApiHelpers("")}
          releaseVersion="edge-1.2.3"
          selectedNamespace="_all"
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    const button = component.find("Button");
    expect(button).toIncludeText("All Namespaces");
  });

  it('renders emojivoto text', () => {
    const component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={() => null}
          classes={{}}
          theme={{}}
          location={loc}
          api={ApiHelpers("")}
          releaseVersion="edge-1.2.3"
          selectedNamespace="emojivoto"
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    const button = component.find("Button");
    expect(button).toIncludeText("emojivoto");
  });

  it('opens the Namespace Selection menu if button is clicked', () => {
    const component = mount(
      <BrowserRouter>
        <Navigation
          ChildComponent={() => null}
          classes={{}}
          theme={{}}
          location={loc}
          api={ApiHelpers("")}
          releaseVersion="edge-1.2.3"
          selectedNamespace="emojivoto"
          pathPrefix=""
          uuid="fakeuuid" />
      </BrowserRouter>
    );

    expect(component.find("Menu").props().open).toBeFalsy();

    const button = component.find("Button");
    button.simulate("click");

    expect(component.find("Menu").props().open).toBeTruthy();
  });

  describe('renders namespace selection menu with correct number of options', () => {
    it('5 options', () => {
      const component = mount(
        <BrowserRouter>
          <Navigation
            ChildComponent={() => null}
            classes={{}}
            theme={{}}
            location={loc}
            api={ApiHelpers("")}
            releaseVersion="edge-1.2.3"
            selectedNamespace="emojivoto"
            pathPrefix=""
            uuid="fakeuuid" />
        </BrowserRouter>
      );

      expect(component.find("Menu").find("MenuItem")).toHaveLength(2);

      component.find("NavigationBase").instance().setState({
        namespaces: namespaces,
      });
      component.update();
      // 5 items = Input - "Select Namespace..." + "All Namespaces" item + 3 added namespaces
      expect(component.find("Menu").find("MenuItem")).toHaveLength(5);
    });

    it('3 options', () => {
      const component = mount(
        <BrowserRouter>
          <Navigation
            ChildComponent={() => null}
            classes={{}}
            theme={{}}
            location={loc}
            api={ApiHelpers("")}
            releaseVersion="edge-1.2.3"
            selectedNamespace="emojivoto"
            pathPrefix=""
            uuid="fakeuuid" />
        </BrowserRouter>
      );

      expect(component.find("Menu").find("MenuItem")).toHaveLength(2);

      component.find("NavigationBase").instance().setState({
        namespaces: namespaces,
        formattedNamespaceFilter: "de",
      });
      component.update();
      // 3 items = "Input - Select Namespace..." + "All Namespaces" item + 1 namespace which matches "de" string
      expect(component.find("Menu").find("MenuItem")).toHaveLength(3);
    });
  });
});
