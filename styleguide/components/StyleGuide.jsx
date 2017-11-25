import * as React from 'react';
import { Component } from 'react';
import * as PropTypes from 'prop-types';
import TableOfContents from 'react-styleguidist/lib/rsg-components/TableOfContents';
import StyleGuideRenderer from 'react-styleguidist/lib/rsg-components/StyleGuide/StyleGuideRenderer';
import ReactComponent from 'react-styleguidist/lib/rsg-components/ReactComponent';
import Sections from 'react-styleguidist/lib/rsg-components/Sections';
import { HOMEPAGE } from 'react-styleguidist/scripts/consts';
import { TabbedPanel } from 'buildo-react-components/src/Panel';
import * as startCase from 'lodash/startCase';
import * as omit from 'lodash/omit';
import * as queryString from 'query-string';
import * as brc from 'buildo-react-components/src';
import Welcome from './Welcome';

export default class StyleGuide extends Component {
  static propTypes = {
    codeRevision: PropTypes.number.isRequired,
    config: PropTypes.object.isRequired,
    slots: PropTypes.object.isRequired,
    // sections: PropTypes.array.isRequired,
    // welcomeScreen: PropTypes.bool,
    // patterns: PropTypes.array,
    isolatedComponent: PropTypes.bool,
    isolatedExample: PropTypes.bool,
    isolatedSection: PropTypes.bool,
  };

  static childContextTypes = {
    codeRevision: PropTypes.number.isRequired,
    config: PropTypes.object.isRequired,
    slots: PropTypes.object.isRequired,
    isolatedComponent: PropTypes.bool,
    isolatedExample: PropTypes.bool,
    isolatedSection: PropTypes.bool,
  };

  static defaultProps = {
    isolatedComponent: false,
  };

  getChildContext() {
    return {
      codeRevision: this.props.codeRevision,
      config: this.props.config,
      slots: this.props.slots,
      isolatedComponent: this.props.isolatedComponent,
      isolatedExample: this.props.isolatedExample,
      isolatedSection: this.props.isolatedSection,
    };
  }

  componentDidMount() {
    this.patchGlobal();
  }

  componentDidUpdate() {
    this.patchGlobal();
  }

  patchGlobal() {
    // TODO: find a better way to make examples work without an "export default" in the component file
    Object.keys(brc).forEach(k => {
      if (k !== '__es6Module') {
        global[k] = brc[k];
      }
    });
    global.getBackgroundUrl = require('buildo-react-components/src/Image').getBackgroundUrl;
  }

  findSection(sections, slug, hack) {
    return sections.reduce((acc, s) => {
      if (acc) {
        return acc;
      } else if (s.slug === slug) {
        return s;
      } else if (s.sections && s.sections.length > 0) {
        return this.findSection(s.sections, slug);
      } else if (s.components && s.components.length > 0) {
        return this.findSection(s.components, slug, true);
      }
    }, null);
  }

  getChildren(section) {
    const isReactComponent = !section.sections && !section.components;

    const activeTabIndex = parseInt(queryString.parse(window.location.hash).tab) || 0;

    const panelProps = {
      type: 'floating',
      style: { border: 'none' },
      className: 'component-tabs',
      tabs: {
        headers: [ 'UX Guidelines', 'Live Examples' ],
        onSetActiveTab: this.onSetActiveTab,
        activeIndex: activeTabIndex
      }
    };

    if (isReactComponent) {
      const component = section;
      const UXGuidelines = {
        components: [],
        sections: [],
        name: component.name,
        slug: component.slug,
        content: [{
          content: 'TODO' || require(`raw-loader!../../sections/components/${component.name}/${component.name}UX.md`),
          type: 'markdown'
        }]
      };

      const children = activeTabIndex === 0 ?
        <Sections sections={[UXGuidelines]} root depth={0} /> :
        <ReactComponent component={component} root />;

      return (
        <div>
          <h1 className='component-title'>{startCase(component.name)}</h1>
          <TabbedPanel {...panelProps}>
            <div className='examples'>
              {children}
            </div>
          </TabbedPanel>
        </div>
      );
    }

    return (
      <div>
        <div style={{ height: 104 }}>
          <div className='pattern-getting-started' style={{ backgroundImage: 'url(pattern.png)' }} />
        </div>
        <Sections sections={[section]} root depth={0} />
      </div>
    );
  }

  onSetActiveTab = (activeTabIndex) => {
    const query = queryString.parse(window.location.hash);
    window.location.hash = queryString.stringify({
      ...query,
      tab: activeTabIndex
    })
  }

  render() {
    const { config, sections, isolatedComponent } = this.props;

    const slug = Object.keys(omit(queryString.parse(window.location.hash), 'tab'))[0];
    const section = this.findSection(sections, slug) || sections[0];

    return (
      <StyleGuideRenderer
        title={config.title}
        homepageUrl={HOMEPAGE}
        toc={<TableOfContents sections={sections} />}
        hasSidebar={config.showSidebar && !isolatedComponent}
      >
        {!window.location.hash ? <Welcome /> : this.getChildren(section)}
      </StyleGuideRenderer>
    );
  }


}
