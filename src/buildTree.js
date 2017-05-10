import TestRenderer from 'react-test-renderer';
import Yoga from 'yoga-layout';
import Context from './utils/Context';
import createStringMeasurer from './utils/createStringMeasurer';
import type { TreeNode } from './types';
import hasAnyDefined from './utils/hasAnyDefined';
import pick from './utils/pick';

const INHERITABLE_STYLES = [
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'textShadowOffset',
  'textShadowRadius',
  'textShadowColor',
  'textTransform',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'writingDirection',
];

const reactTreeToYogaTree = (node: TreeNode, context: Context): Yoga.Node => {
  const yogaNode = Yoga.Node.create();

  if (typeof node === 'string') {
    const textStyle = context.getInheritedStyles();

    const style = createStringMeasurer(node, textStyle);

    yogaNode.setWidth(style.width);
    yogaNode.setHeight(style.height);

    yogaNode.data = {
      type: 'text',
      style: { measure: style },
      textStyle,
      props: {},
      value: node,
    };
    return yogaNode;
  }

  const children = node.children || [];
  const style = node.props.style || {};

  let textStyle;
  if (node.type === 'text' && node.props.style && hasAnyDefined(style, INHERITABLE_STYLES)) {
    const inheritableStyles = pick(style, INHERITABLE_STYLES);
    context.addInheritableStyles(inheritableStyles);
    textStyle = {
      ...context.getInheritedStyles(),
      ...inheritableStyles,
    };
  } else {
    textStyle = context.getInheritedStyles();
  }

  // TODO: map layout style to yoga methods

  yogaNode.data = {
    type: node.type,
    style,
    textStyle,
    props: node.props,
    value: null,
  };

  children.forEach((child, i) =>
    yogaNode.insertChild(reactTreeToYogaTree(child, context.forChildren()), i)
  );

  return yogaNode;
};

const buildTree = (element: React$Element<any>): TreeNode => {
  const renderer = TestRenderer.create(element);
  const json: TreeNode = renderer.toJSON();
  const tree = reactTreeToYogaTree(json, new Context());
  tree.calculateLayout();

  return tree;
};

export default buildTree;
