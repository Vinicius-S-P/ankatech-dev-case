import React from 'react';

interface ConditionalLayoutProps {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactElement;
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({
  condition,
  wrapper,
  children,
}) => {
  return condition ? wrapper(children) : <>{children}</>;
};

export default ConditionalLayout;